import { TRPCError } from '@trpc/server';
import { and, asc, count, countDistinct, desc, eq, gte, like, or, sql } from 'drizzle-orm';
import { z } from 'zod';

import {
  agents,
  agentsFiles,
  agentsKnowledgeBases,
  files,
  knowledgeBases,
  messages,
  sessions,
  users,
} from '@/database/schemas';
import { aiModels, aiProviders } from '@/database/schemas/aiInfra';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { getServerDashboardMetrics } from '@/services/admin/serverHelpers';

// Admin middleware to check privileges
const adminProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;
  const { userId } = ctx;

  if (!userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User not authenticated',
    });
  }

  // Check admin privileges
  const user = await ctx.serverDB.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      isAdmin: true,
    },
  });

  if (!user?.isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin privileges required',
    });
  }

  return opts.next();
});

export const adminRouter = router({
  // Dashboard metrics
  getDashboardMetrics: adminProcedure.query(async ({ ctx }) => {
    return getServerDashboardMetrics();
  }),

  // User management
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        search: z.string().optional(),
        filter: z.enum(['all', 'active', 'inactive', 'admin']).default('all'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, filter } = input;
      const offset = (page - 1) * pageSize;

      // Build where conditions
      const whereConditions = [];

      if (search) {
        whereConditions.push(
          sql`${users.fullName} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`} OR ${users.username} ILIKE ${`%${search}%`}`,
        );
      }

      if (filter === 'admin') {
        whereConditions.push(eq(users.isAdmin, true));
      } else if (filter === 'active') {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        whereConditions.push(gte(users.updatedAt, sevenDaysAgo));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get users with pagination
      const [totalResult] = await ctx.serverDB
        .select({ count: count() })
        .from(users)
        .where(whereClause);

      const userList = await ctx.serverDB.query.users.findMany({
        where: whereClause,
        limit: pageSize,
        offset,
        orderBy: [desc(users.createdAt)],
        columns: {
          id: true,
          email: true,
          fullName: true,
          avatar: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Get additional stats for each user
      const usersWithStats = await Promise.all(
        userList.map(async (user) => {
          const [messageCount] = await ctx.serverDB
            .select({ count: count() })
            .from(messages)
            .where(eq(messages.userId, user.id));

          const [sessionCount] = await ctx.serverDB
            .select({ count: count() })
            .from(sessions)
            .where(eq(sessions.userId, user.id));

          return {
            ...user,
            messageCount: messageCount.count,
            sessionCount: sessionCount.count,
          };
        }),
      );

      return {
        users: usersWithStats,
        total: totalResult.count,
        page,
        pageSize,
        totalPages: Math.ceil(totalResult.count / pageSize),
      };
    }),

  // Toggle user admin status
  toggleUserAdmin: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId: targetUserId, isAdmin } = input;

      // Prevent self-demotion
      if (targetUserId === ctx.userId && !isAdmin) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove your own admin privileges',
        });
      }

      await ctx.serverDB
        .update(users)
        .set({ isAdmin, updatedAt: new Date() })
        .where(eq(users.id, targetUserId));

      return { success: true };
    }),

  // Get model configuration
  getModelConfig: adminProcedure.query(async ({ ctx }) => {
    // Fetch all AI providers with their models
    const providers = await ctx.serverDB.query.aiProviders.findMany({
      orderBy: [asc(aiProviders.sort)],
      where: and(
        or(
          eq(aiProviders.source, 'builtin'),
          and(eq(aiProviders.source, 'custom'), eq(aiProviders.userId, ctx.userId)),
        ),
      ),
      with: {
        models: {
          orderBy: [asc(aiModels.sort)],
        },
      },
    });

    // Decrypt keyVaults if available
    const { KeyVaultsGateKeeper } = await import('@/server/modules/KeyVaultsEncrypt');
    const gateKeeper = await KeyVaultsGateKeeper.initWithEnvKey();

    return {
      providers: await Promise.all(
        providers.map(async (provider) => {
          let decryptedKeyVaults = {};
          if (provider.keyVaults) {
            try {
              const { plaintext, wasAuthentic } = await gateKeeper.decrypt(provider.keyVaults);
              if (wasAuthentic) {
                decryptedKeyVaults = JSON.parse(plaintext);
              }
            } catch (error) {
              console.error('Failed to decrypt keyVaults for provider:', provider.id, error);
            }
          }

          return {
            id: provider.id,
            name: provider.name || provider.id,
            logo: provider.logo,
            enabled: provider.enabled,
            keyVaults: decryptedKeyVaults,
            settings: provider.settings || {},
            models: provider.models.map((model) => ({
              id: model.id,
              displayName: model.displayName || model.id,
              enabled: model.enabled,
              type: model.type,
              contextWindow: model.contextWindowTokens,
            })),
          };
        }),
      ),
    };
  }),

  // Update provider configuration
  updateProviderConfig: adminProcedure
    .input(
      z.object({
        providerId: z.string(),
        enabled: z.boolean().optional(),
        settings: z.record(z.any()).optional(),
        keyVaults: z.record(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // If keyVaults are provided, encrypt them
      let encryptedKeyVaults: string | undefined;
      if (input.keyVaults) {
        // Check if KEY_VAULTS_SECRET is available
        const keyVaultsSecret = process.env.KEY_VAULTS_SECRET;
        if (!keyVaultsSecret) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message:
              'KEY_VAULTS_SECRET not configured. Please set this environment variable to enable API key storage.',
          });
        }

        // Encrypt the keyVaults
        const { KeyVaultsGateKeeper } = await import('@/server/modules/KeyVaultsEncrypt');
        const gateKeeper = await KeyVaultsGateKeeper.initWithEnvKey();
        encryptedKeyVaults = await gateKeeper.encrypt(JSON.stringify(input.keyVaults));
      }

      // Check if this is a builtin provider - we need to update the global config
      const provider = await ctx.serverDB.query.aiProviders.findFirst({
        where: and(eq(aiProviders.id, input.providerId), eq(aiProviders.source, 'builtin')),
      });

      if (provider) {
        // For builtin providers, update the admin's config
        await ctx.serverDB
          .update(aiProviders)
          .set({
            enabled: input.enabled,
            settings: input.settings,
            keyVaults: encryptedKeyVaults,
            updatedAt: new Date(),
          })
          .where(and(eq(aiProviders.id, input.providerId), eq(aiProviders.userId, ctx.userId)));
      } else {
        // For custom providers, just update normally
        await ctx.serverDB
          .update(aiProviders)
          .set({
            enabled: input.enabled,
            settings: input.settings,
            keyVaults: encryptedKeyVaults,
            updatedAt: new Date(),
          })
          .where(and(eq(aiProviders.id, input.providerId), eq(aiProviders.userId, ctx.userId)));
      }

      // Clear the admin provider cache so changes take effect immediately
      const { clearAdminProviderCache } = await import('@/server/globalConfig/adminProviderConfig');
      clearAdminProviderCache();

      return { success: true };
    }),

  // Get billing plans and subscription data
  getBillingData: adminProcedure.query(async ({ ctx }) => {
    // Get all users with their subscription status
    const allUsers = await ctx.serverDB.query.users.findMany({
      columns: {
        id: true,
        isAdmin: true,
      },
    });

    // Count by subscription type (simplified - in a real app you'd have subscription tables)
    const freeUsers = allUsers.filter((u) => !u.isAdmin).length;
    const proUsers = Math.floor(allUsers.length * 0.2); // Simulated 20% pro users
    const enterpriseUsers = Math.floor(allUsers.length * 0.05); // Simulated 5% enterprise

    // Calculate revenue
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'monthly' as const,
        tokensPerMonth: 100_000,
        maxTokensPerRequest: 4000,
        features: ['Basic chat functionality', 'GPT-3.5 access', 'Community support'],
        isActive: true,
        subscriberCount: freeUsers,
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 29.99,
        interval: 'monthly' as const,
        tokensPerMonth: 1_000_000,
        maxTokensPerRequest: 8000,
        features: [
          'All Free features',
          'GPT-4 access',
          'Priority support',
          'Custom agents',
          'Advanced analytics',
        ],
        isActive: true,
        subscriberCount: proUsers,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99.99,
        interval: 'monthly' as const,
        tokensPerMonth: 5_000_000,
        maxTokensPerRequest: 16_000,
        features: [
          'All Pro features',
          'Unlimited custom agents',
          'API access',
          'Dedicated support',
          'Custom integrations',
          'SLA guarantee',
        ],
        isActive: true,
        subscriberCount: enterpriseUsers,
      },
    ];

    const totalRevenue = plans.reduce((sum, plan) => sum + plan.price * plan.subscriberCount, 0);
    const totalSubscribers = plans.reduce((sum, plan) => sum + plan.subscriberCount, 0);

    return {
      plans,
      summary: {
        totalRevenue,
        totalSubscribers,
        averageRevenuePerUser: totalSubscribers > 0 ? totalRevenue / totalSubscribers : 0,
      },
    };
  }),

  // Get analytics data
  getAnalytics: adminProcedure
    .input(
      z.object({
        timeRange: z.enum(['7d', '30d', '90d']).default('30d'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timeRange } = input;

      // Calculate date range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get message counts by day
      const messageVolumeData = await ctx.serverDB
        .select({
          date: sql<string>`TO_CHAR(${messages.createdAt}::date, 'MM/DD')`,
          count: count(),
        })
        .from(messages)
        .where(gte(messages.createdAt, startDate))
        .groupBy(sql`${messages.createdAt}::date`)
        .orderBy(sql`${messages.createdAt}::date`);

      // Get user signups by day
      const userSignupsData = await ctx.serverDB
        .select({
          date: sql<string>`TO_CHAR(${users.createdAt}::date, 'MM/DD')`,
          count: count(),
        })
        .from(users)
        .where(gte(users.createdAt, startDate))
        .groupBy(sql`${users.createdAt}::date`)
        .orderBy(sql`${users.createdAt}::date`);

      // Get total messages in period
      const [totalMessagesResult] = await ctx.serverDB
        .select({ count: count() })
        .from(messages)
        .where(gte(messages.createdAt, startDate));

      // Get new users in period
      const [newUsersResult] = await ctx.serverDB
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, startDate));

      // Calculate averages
      const totalMessages = totalMessagesResult?.count || 0;
      const newUsers = newUsersResult?.count || 0;
      const avgDailyMessages = Math.round(totalMessages / days);

      // Get session data (simplified - you may want to implement proper session tracking)
      const avgSessionLength = 25.5; // minutes - placeholder

      // Get model usage distribution
      const modelUsageData = await ctx.serverDB
        .select({
          model: messages.model,
          count: count(),
        })
        .from(messages)
        .where(gte(messages.createdAt, startDate))
        .groupBy(messages.model)
        .orderBy(sql`count(*) DESC`)
        .limit(5);

      // Calculate percentages for model usage
      const totalModelUsage = modelUsageData.reduce((sum, item) => sum + item.count, 0);
      const modelUsage = modelUsageData.map((item) => ({
        model: item.model || 'Unknown',
        count: item.count,
        percentage: Math.round((item.count / totalModelUsage) * 100),
      }));

      // Get top agents by message count
      const topAgentsData = await ctx.serverDB
        .select({
          agentId: agents.id,
          title: agents.title,
          messages: count(messages.id),
          users: countDistinct(messages.userId),
        })
        .from(agents)
        .leftJoin(messages, eq(messages.parentId, agents.id))
        .where(gte(messages.createdAt, startDate))
        .groupBy(agents.id, agents.title)
        .orderBy(sql`count(${messages.id}) DESC`)
        .limit(5);

      const topAgents = topAgentsData.map((agent) => ({
        name: agent.title || 'Unnamed Agent',
        messages: agent.messages,
        users: agent.users || 0,
      }));

      // Get token usage over time (placeholder - implement based on your token tracking)
      const tokenUsage = messageVolumeData.map((day) => ({
        date: day.date,
        tokens: day.count * 150, // Rough estimate
      }));

      return {
        summary: {
          totalMessages,
          newUsers,
          avgDailyMessages,
          avgSessionLength,
        },
        messageVolume: messageVolumeData,
        userSignups: userSignupsData,
        modelUsage,
        topAgents,
        tokenUsage,
      };
    }),

  // Agent management endpoints
  getAgents: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        search: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, category } = input;
      const offset = (page - 1) * pageSize;

      // Build query conditions
      const conditions = [];

      // Only show domain agents created by admins
      conditions.push(eq(agents.isDomain, true));

      if (search) {
        conditions.push(
          sql`(${agents.title} ILIKE ${`%${search}%`} OR ${agents.description} ILIKE ${`%${search}%`})`,
        );
      }

      if (category && category !== 'all') {
        conditions.push(eq(agents.category, category));
      }

      // Get total count
      const [totalResult] = await ctx.serverDB
        .select({ count: count() })
        .from(agents)
        .where(and(...conditions));

      // Get paginated agents with knowledge base info
      const agentsList = await ctx.serverDB
        .select({
          id: agents.id,
          name: agents.title,
          description: agents.description,
          systemPrompt: agents.systemRole,
          category: agents.category,
          tags: agents.tags,
          isPublic: agents.isDomain,
          isDomain: agents.isDomain,
          createdAt: agents.createdAt,
          userId: agents.userId,
          knowledgeBaseCount: count(agentsKnowledgeBases.knowledgeBaseId),
        })
        .from(agents)
        .leftJoin(agentsKnowledgeBases, eq(agents.id, agentsKnowledgeBases.agentId))
        .where(and(...conditions))
        .groupBy(agents.id)
        .orderBy(desc(agents.createdAt))
        .limit(pageSize)
        .offset(offset);

      return {
        agents: agentsList,
        total: totalResult?.count || 0,
        page,
        pageSize,
      };
    }),

  createAgent: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        systemPrompt: z.string(),
        category: z.string(),
        tags: z.array(z.string()).default([]),
        isDomain: z.boolean().default(false),
        knowledgeBaseFiles: z
          .array(
            z.object({
              name: z.string(),
              size: z.number(),
              type: z.string().optional(),
              content: z.string().optional(), // base64 content
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { knowledgeBaseFiles, ...agentData } = input;

      // Create the agent
      const [newAgent] = await ctx.serverDB
        .insert(agents)
        .values({
          title: agentData.name,
          description: agentData.description,
          systemRole: agentData.systemPrompt,
          category: agentData.category,
          tags: agentData.tags,
          isDomain: agentData.isDomain,
          userId: ctx.userId,
        })
        .returning();

      // If there are knowledge base files, create a knowledge base
      if (knowledgeBaseFiles && knowledgeBaseFiles.length > 0) {
        // Create knowledge base
        const [kb] = await ctx.serverDB
          .insert(knowledgeBases)
          .values({
            name: `${agentData.name} Knowledge Base`,
            description: `Knowledge base for ${agentData.name}`,
            type: 'agent',
            userId: ctx.userId,
            isPublic: agentData.isDomain,
          })
          .returning();

        // Link knowledge base to agent
        await ctx.serverDB.insert(agentsKnowledgeBases).values({
          agentId: newAgent.id,
          knowledgeBaseId: kb.id,
          userId: ctx.userId,
        });

        // TODO: Handle file uploads to S3/storage and create file records
        // For now, we're just storing metadata
      }

      return newAgent;
    }),

  updateAgent: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        systemPrompt: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isDomain: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const updateData: any = {};
      if (updates.name !== undefined) updateData.title = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.systemPrompt !== undefined) updateData.systemRole = updates.systemPrompt;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.isDomain !== undefined) updateData.isDomain = updates.isDomain;

      const [updatedAgent] = await ctx.serverDB
        .update(agents)
        .set(updateData)
        .where(and(eq(agents.id, id), eq(agents.isDomain, true)))
        .returning();

      return updatedAgent;
    }),

  deleteAgent: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Only allow deleting domain agents
      await ctx.serverDB
        .delete(agents)
        .where(and(eq(agents.id, input.id), eq(agents.isDomain, true)));

      return { success: true };
    }),

  getAgentCategories: adminProcedure.query(async () => {
    // Return the predefined categories from AssistantCategory enum
    return [
      { value: 'academic', label: 'Acadêmico' },
      { value: 'career', label: 'Carreira' },
      { value: 'copywriting', label: 'Redação' },
      { value: 'design', label: 'Design' },
      { value: 'education', label: 'Educação' },
      { value: 'emotions', label: 'Emoções' },
      { value: 'entertainment', label: 'Entretenimento' },
      { value: 'games', label: 'Jogos' },
      { value: 'general', label: 'Geral' },
      { value: 'life', label: 'Vida' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'office', label: 'Escritório' },
      { value: 'programming', label: 'Programação' },
      { value: 'translation', label: 'Tradução' },
    ];
  }),
});

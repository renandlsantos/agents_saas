import { TRPCError } from '@trpc/server';
import { and, count, countDistinct, desc, eq, gte, like, sql } from 'drizzle-orm';
import { z } from 'zod';

import { agents, messages, sessions, users } from '@/database/schemas';
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
    // This would fetch from your model configuration
    // For now, returning a placeholder structure
    return {
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          enabled: true,
          models: ['gpt-4', 'gpt-3.5-turbo'],
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          enabled: true,
          models: ['claude-3-opus', 'claude-3-sonnet'],
        },
      ],
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
});

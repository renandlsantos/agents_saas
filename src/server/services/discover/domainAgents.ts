import { eq } from 'drizzle-orm';

import { agents } from '@/database/schemas';
import { serverDB } from '@/database/server';
import { AssistantCategory, DiscoverAssistantItem } from '@/types/discover';

export class DomainAgentsService {
  async getDomainAgents(): Promise<DiscoverAssistantItem[]> {
    try {
      // Fetch all domain agents from database
      const domainAgents = await serverDB.query.agents.findMany({
        where: eq(agents.isDomain, true),
        columns: {
          id: true,
          slug: true,
          title: true,
          description: true,
          avatar: true,
          backgroundColor: true,
          tags: true,
          category: true,
          createdAt: true,
          systemRole: true,
          model: true,
          provider: true,
        },
      });

      // Transform database agents to DiscoverAssistantItem format
      return domainAgents.map((agent) => ({
        author: 'Agents SaaS',
        createdAt: agent.createdAt.toISOString(),
        homepage: '/discover/assistant/' + (agent.slug || agent.id),
        identifier: agent.slug || agent.id,
        isDomain: true,
        meta: {
          avatar: agent.avatar || '',
          category: (agent.category as AssistantCategory) || AssistantCategory.General,
          description: agent.description || '',
          tags: (agent.tags as string[]) || [],
          title: agent.title || 'Unnamed Agent',
        },
        schemaVersion: 1,
        config: {
          systemRole: agent.systemRole || '',
          model: agent.model || 'gpt-3.5-turbo',
          provider: agent.provider || 'openai',
          params: {},
          chatConfig: {
            displayMode: 'chat' as const,
            historyCount: 4,
            enableHistoryCount: true,
            autoCreateTopicThreshold: 2,
          },
          tts: {
            sttLocale: 'auto',
            ttsService: 'openai' as const,
            voice: {
              openai: 'nova',
            },
          },
        },
        socialData: {
          conversations: 0,
          likes: 0,
          users: 0,
        },
        suggestions: [],
      }));
    } catch (error) {
      console.error('Error fetching domain agents:', error);
      return [];
    }
  }

  async getDomainAgentBySlug(slug: string): Promise<DiscoverAssistantItem | undefined> {
    try {
      const agent = await serverDB.query.agents.findFirst({
        where: eq(agents.slug, slug),
        columns: {
          id: true,
          slug: true,
          title: true,
          description: true,
          avatar: true,
          backgroundColor: true,
          tags: true,
          category: true,
          createdAt: true,
          systemRole: true,
          model: true,
          provider: true,
          openingMessage: true,
          openingQuestions: true,
        },
      });

      if (!agent) return undefined;

      return {
        author: 'Agents SaaS',
        config: {
          systemRole: agent.systemRole || '',
          model: agent.model || 'gpt-3.5-turbo',
          provider: agent.provider || 'openai',
          params: {},
          chatConfig: {
            displayMode: 'chat' as const,
            historyCount: 4,
            enableHistoryCount: true,
            autoCreateTopicThreshold: 2,
          },
          tts: {
            sttLocale: 'auto',
            ttsService: 'openai' as const,
            voice: {
              openai: 'nova',
            },
          },
        },
        createdAt: agent.createdAt.toISOString(),
        homepage: '/discover/assistant/' + (agent.slug || agent.id),
        identifier: agent.slug || agent.id,
        isDomain: true,
        meta: {
          avatar: agent.avatar || '',
          backgroundColor: agent.backgroundColor || undefined,
          category: (agent.category as AssistantCategory) || AssistantCategory.General,
          description: agent.description || '',
          tags: (agent.tags as string[]) || [],
          title: agent.title || 'Unnamed Agent',
        },
        schemaVersion: 1,
        socialData: {
          conversations: 0,
          likes: 0,
          users: 0,
        },
        suggestions: [],
      };
    } catch (error) {
      console.error('Error fetching domain agent by slug:', error);
      return undefined;
    }
  }
}

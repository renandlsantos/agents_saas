import { lambdaClient } from '@/libs/trpc/client';
import { AdminDashboardMetrics } from '@/store/admin/slices/dashboard';

class AdminService {
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    return lambdaClient.admin.getDashboardMetrics.query();
  }

  async getUsers(params: {
    filter?: 'all' | 'active' | 'inactive' | 'admin';
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    return lambdaClient.admin.getUsers.query(params);
  }

  async toggleUserAdmin(userId: string, isAdmin: boolean) {
    return lambdaClient.admin.toggleUserAdmin.mutate({ userId, isAdmin });
  }

  async getModelConfig() {
    return lambdaClient.admin.getModelConfig.query();
  }

  async getAnalytics(timeRange: '7d' | '30d' | '90d' = '30d') {
    return lambdaClient.admin.getAnalytics.query({ timeRange });
  }

  async getAgents(params: {
    category?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    return lambdaClient.admin.getAgents.query(params);
  }

  async createAgent(data: {
    category: string;
    description: string;
    isDomain: boolean;
    knowledgeBaseFiles?: Array<{
      content?: string;
      name: string;
      size: number;
      type?: string;
    }>;
    name: string;
    systemPrompt: string;
    tags: string[];
  }) {
    return lambdaClient.admin.createAgent.mutate(data);
  }

  async updateAgent(
    id: string,
    data: {
      category?: string;
      description?: string;
      isDomain?: boolean;
      name?: string;
      systemPrompt?: string;
      tags?: string[];
    },
  ) {
    return lambdaClient.admin.updateAgent.mutate({ id, ...data });
  }

  async deleteAgent(id: string) {
    return lambdaClient.admin.deleteAgent.mutate({ id });
  }

  async getAgentCategories() {
    return lambdaClient.admin.getAgentCategories.query();
  }
}

export const adminService = new AdminService();

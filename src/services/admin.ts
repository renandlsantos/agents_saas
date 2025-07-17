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
}

export const adminService = new AdminService();

import { BaseClientService } from '@/services/baseClientService';
import { AdminDashboardMetrics } from '@/store/admin/slices/dashboard';

import { IAdminService } from './type';

export class ClientService extends BaseClientService implements IAdminService {
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    // For client mode, return mock data
    return this.getMockMetrics();
  }

  private getMockMetrics(): AdminDashboardMetrics {
    return {
      totalUsers: 1250,
      activeUsers: 847,
      userGrowth: 12.5,
      activeUserGrowth: 8.3,
      totalMessages: 125_430,
      messageGrowth: 15.2,
      totalTokens: 8_500_000,
      tokenGrowth: 22.7,
      activeSubscriptions: 234,
      subscriptionGrowth: 10.8,
      monthlyRevenue: 7023.66,
      revenueGrowth: 18.4,
      activeModels: 8,
      customAgents: 42,
      agentGrowth: 25,
    };
  }
}

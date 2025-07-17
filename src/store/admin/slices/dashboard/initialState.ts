export interface AdminDashboardMetrics {
  // System metrics
  activeModels: number;
  // Business metrics
  activeSubscriptions: number;
  activeUserGrowth: number;
  activeUsers: number;

  agentGrowth: number;
  customAgents: number;
  messageGrowth: number;
  monthlyRevenue: number;

  revenueGrowth: number;
  subscriptionGrowth: number;
  tokenGrowth: number;
  // Usage metrics
  totalMessages: number;

  totalTokens: number;
  // User metrics
  totalUsers: number;
  userGrowth: number;
}

export interface AdminDashboardState {
  error: string | null;
  lastRefresh: number | null;
  loading: boolean;
  metrics: AdminDashboardMetrics;
}

export const initialDashboardState: AdminDashboardState = {
  metrics: {
    totalUsers: 0,
    activeUsers: 0,
    userGrowth: 0,
    activeUserGrowth: 0,
    totalMessages: 0,
    messageGrowth: 0,
    totalTokens: 0,
    tokenGrowth: 0,
    activeSubscriptions: 0,
    subscriptionGrowth: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    activeModels: 0,
    customAgents: 0,
    agentGrowth: 0,
  },
  loading: false,
  error: null,
  lastRefresh: null,
};

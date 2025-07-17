import { AdminStoreState } from '../../initialState';

const metrics = (s: AdminStoreState) => s.metrics;
const loading = (s: AdminStoreState) => s.loading;
const error = (s: AdminStoreState) => s.error;
const lastRefresh = (s: AdminStoreState) => s.lastRefresh;

const totalUsers = (s: AdminStoreState) => s.metrics.totalUsers;
const activeUsers = (s: AdminStoreState) => s.metrics.activeUsers;
const totalMessages = (s: AdminStoreState) => s.metrics.totalMessages;
const totalTokens = (s: AdminStoreState) => s.metrics.totalTokens;
const monthlyRevenue = (s: AdminStoreState) => s.metrics.monthlyRevenue;

export const dashboardSelectors = {
  metrics,
  loading,
  error,
  lastRefresh,
  totalUsers,
  activeUsers,
  totalMessages,
  totalTokens,
  monthlyRevenue,
};

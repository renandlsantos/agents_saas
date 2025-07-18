import { AdminDashboardMetrics } from '@/store/admin/slices/dashboard';

export interface IAdminService {
  getDashboardMetrics(): Promise<AdminDashboardMetrics>;
}

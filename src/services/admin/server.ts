import { lambdaClient } from '@/libs/trpc/client';

import { IAdminService } from './type';

export class ServerService implements IAdminService {
  async getDashboardMetrics() {
    return lambdaClient.admin.getDashboardMetrics.query();
  }
}

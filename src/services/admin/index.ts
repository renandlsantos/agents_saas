import { isDesktop } from '@/const/version';

import { ClientService } from './client';
import { ServerService } from './server';

export const adminService =
  process.env.NEXT_PUBLIC_SERVICE_MODE === 'server' || isDesktop
    ? new ServerService()
    : new ClientService();

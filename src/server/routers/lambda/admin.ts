import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { users } from '@/database/schemas';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { getServerDashboardMetrics } from '@/services/admin/serverHelpers';

export const adminRouter = router({
  getDashboardMetrics: authedProcedure
    .use(serverDatabase)
    .use(async (opts) => {
      // Check if user is admin
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
    })
    .query(async ({ ctx }) => {
      return getServerDashboardMetrics();
    }),
});

import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

import { captureException } from '@/utils/sentry';

import { AsyncContext } from './context';

export const asyncTrpc = initTRPC.context<AsyncContext>().create({
  errorFormatter({ shape, error, ctx }) {
    // Capture errors to Sentry
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      captureException(error, {
        userId: ctx?.userId || undefined,
        operation: `tRPC:${shape.data?.path}`,
        tags: {
          type: 'trpc-async',
          code: error.code,
        },
        metadata: {
          path: shape.data?.path,
        },
      });
    }

    return shape;
  },
  transformer: superjson,
});

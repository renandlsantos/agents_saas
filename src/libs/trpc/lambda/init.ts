/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @link https://trpc.io/docs/v11/router
 * @link https://trpc.io/docs/v11/procedures
 */
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

import { captureException } from '@/utils/sentry';

import type { LambdaContext } from './context';

export const trpc = initTRPC.context<LambdaContext>().create({
  /**
   * @link https://trpc.io/docs/v11/error-formatting
   */
  errorFormatter({ shape, error, ctx }) {
    // Capture errors to Sentry
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      captureException(error, {
        userId: ctx?.userId || undefined,
        operation: `tRPC:${shape.data?.path}`,
        tags: {
          type: 'trpc',
          code: error.code,
        },
        metadata: {
          path: shape.data?.path,
        },
      });
    }

    return shape;
  },
  /**
   * @link https://trpc.io/docs/v11/data-transformers
   */
  transformer: superjson,
});

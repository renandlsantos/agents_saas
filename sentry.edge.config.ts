// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

if (!!process.env.NEXT_PUBLIC_SENTRY_DSN) {
  try {
    Sentry.init({
      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      environment: process.env.NODE_ENV || 'development',

      // Performance Monitoring
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
        ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
        : process.env.NODE_ENV === 'production'
          ? 0.1
          : 1,

      // Release tracking
      release: process.env.NEXT_PUBLIC_VERSION || 'unknown',

      // Filter transactions
      beforeSendTransaction(transaction) {
        // Don't send transactions for health checks
        if (transaction.transaction?.includes('/api/health')) {
          return null;
        }

        // Don't send transactions for static assets
        if (transaction.transaction?.includes('/_next/static')) {
          return null;
        }

        return transaction;
      },

      // Add edge context
      beforeSend(event) {
        // Add edge-specific context
        event.contexts = {
          ...event.contexts,
          runtime: {
            name: 'edge',
          },
        };

        return event;
      },
    });
  } catch (error) {
    console.warn('Failed to initialize Sentry in edge runtime:', error);
  }
}

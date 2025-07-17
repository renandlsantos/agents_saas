// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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

      // Profiling (requires tracing to be enabled)
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

      // Integrations
      integrations: [
        // Automatically instrument Node.js libraries and frameworks
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
      ],

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

      // Add server context
      beforeSend(event, hint) {
        // Add server-specific context
        event.contexts = {
          ...event.contexts,
          runtime: {
            name: 'node',
            version: process.version,
          },
        };

        // Filter out expected errors
        if (
          hint.originalException instanceof Error && // Don't send ECONNREFUSED errors (common in development)
          hint.originalException.message?.includes('ECONNREFUSED')
        ) {
          return null;
        }

        return event;
      },

      // uncomment the line below to enable Spotlight (https://spotlightjs.com)
      // spotlight: process.env.NODE_ENV === 'development',
    });
  } catch (error) {
    console.warn('Failed to initialize Sentry on server:', error);
  }
}

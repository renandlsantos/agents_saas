// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

if (!!process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    environment: process.env.NODE_ENV || 'development',

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      Sentry.replayIntegration({
        blockAllMedia: true,
        // Additional Replay configuration goes in here, for example:
        maskAllText: true,
      }),
      // Browser Tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
        tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
      : process.env.NODE_ENV === 'production'
        ? 0.1
        : 1,

    // Session Replay
    replaysOnErrorSampleRate: 1,
    replaysSessionSampleRate: process.env.SENTRY_REPLAY_SESSION_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_REPLAY_SESSION_SAMPLE_RATE)
      : process.env.NODE_ENV === 'production'
        ? 0.1
        : 0.5,

    // Release tracking
    release: process.env.NEXT_PUBLIC_VERSION || 'unknown',

    // Filter out certain errors
    beforeSend(event, hint) {
      // Filter out errors from browser extensions
      if (event.exception && hint.originalException) {
        const error = hint.originalException as Error;
        if (error.message?.includes('extension://')) {
          return null;
        }
      }

      // Filter out network errors that are expected
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }

      return event;
    },

    // Add context to errors
    beforeSendTransaction(transaction) {
      // Don't send transactions for health checks
      if (transaction.transaction?.includes('/api/health')) {
        return null;
      }

      return transaction;
    },
  });
}

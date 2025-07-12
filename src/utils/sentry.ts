import * as Sentry from '@sentry/nextjs';
import { headers } from 'next/headers';

export interface ErrorContext {
  metadata?: Record<string, any>;
  operation?: string;
  tags?: Record<string, string>;
  userId?: string;
}

/**
 * Capture an exception and send it to Sentry with context
 */
export const captureException = (error: unknown, context?: ErrorContext): string | undefined => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error('Sentry error (not sent):', error, context);
    return undefined;
  }

  // Set user context if available
  if (context?.userId) {
    Sentry.setUser({ id: context.userId });
  }

  // Set tags if available
  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  }

  // Set extra context
  if (context?.metadata) {
    Sentry.setContext('metadata', context.metadata);
  }

  if (context?.operation) {
    Sentry.setContext('operation', { name: context.operation });
  }

  // Capture the exception
  const eventId = Sentry.captureException(error);

  // Clear user context after capturing
  if (context?.userId) {
    Sentry.setUser(null);
  }

  return eventId;
};

/**
 * Capture a message and send it to Sentry
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: ErrorContext,
): string | undefined => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log(`Sentry ${level}:`, message, context);
    return undefined;
  }

  // Set context similar to captureException
  if (context?.userId) {
    Sentry.setUser({ id: context.userId });
  }

  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  }

  if (context?.metadata) {
    Sentry.setContext('metadata', context.metadata);
  }

  const eventId = Sentry.captureMessage(message, level);

  if (context?.userId) {
    Sentry.setUser(null);
  }

  return eventId;
};

/**
 * Start a Sentry transaction for performance monitoring
 */
export const startTransaction = (
  name: string,
  op: string,
  description?: string,
): ReturnType<typeof Sentry.startTransaction> | undefined => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return undefined;
  }

  return Sentry.startTransaction({
    name,
    op,
    description,
  });
};

/**
 * Wrap an async function with Sentry error handling
 */
export async function withSentry<T>(fn: () => Promise<T>, context?: ErrorContext): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    captureException(error, context);
    throw error;
  }
}

/**
 * Create a Sentry-wrapped API handler
 */
export function withSentryAPI<T extends (...args: any[]) => any>(
  handler: T,
  operationName: string,
): T {
  return (async (...args: Parameters<T>) => {
    const transaction = startTransaction(operationName, 'http.server');

    try {
      const result = await handler(...args);
      transaction?.setHttpStatus(200);
      return result;
    } catch (error) {
      transaction?.setHttpStatus(500);
      captureException(error, {
        operation: operationName,
        tags: {
          type: 'api',
        },
      });
      throw error;
    } finally {
      transaction?.finish();
    }
  }) as T;
}

/**
 * Sentry breadcrumb helper
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>,
): void => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Get request metadata for error context
 */
export async function getRequestContext(): Promise<Record<string, any>> {
  try {
    const headersList = await headers();
    return {
      userAgent: headersList.get('user-agent'),
      referer: headersList.get('referer'),
      ip: headersList.get('x-forwarded-for') || headersList.get('x-real-ip'),
    };
  } catch {
    return {};
  }
}

import NextAuth from 'next-auth';

import { authEnv } from '@/config/auth';
import { getServerDBConfig } from '@/config/db';

import { LobeNextAuthDbAdapter } from './adapter';
import config from './auth.config';
import credentialsProvider from './sso-providers/credentials';

const { NEXT_PUBLIC_ENABLED_SERVER_SERVICE } = getServerDBConfig();

// Add credentials provider if it's configured
const addCredentialsProvider = () => {
  if (!authEnv.NEXT_PUBLIC_ENABLE_NEXT_AUTH) return [];

  const hasCredentials = authEnv.NEXT_AUTH_SSO_PROVIDERS.split(/[,，]/).some(
    (provider) => provider.trim() === 'credentials',
  );

  return hasCredentials ? [credentialsProvider.provider] : [];
};

// Initialize database adapter safely
const getAdapter = () => {
  if (!NEXT_PUBLIC_ENABLED_SERVER_SERVICE) return undefined;

  try {
    // Import serverDB only when needed
    const { serverDB } = require('@/database/server');
    return LobeNextAuthDbAdapter(serverDB);
  } catch (error) {
    console.error('Failed to initialize NextAuth database adapter:', error);
    console.warn('Falling back to JWT-only mode without database adapter');
    // Fallback to JWT-only mode if database connection fails
    return undefined;
  }
};

/**
 * NextAuth initialization with Database adapter
 *
 * @example
 * ```ts
 * import NextAuthNode from '@/libs/next-auth';
 * const { handlers } = NextAuthNode;
 * ```
 *
 * @note
 * If you meet the edge runtime compatible problem,
 * you can import from `@/libs/next-auth/edge` which is not initial with the database adapter.
 *
 * The difference and usage of the two different NextAuth modules is can be
 * ref to: https://github.com/lobehub/lobe-chat/pull/2935
 */
export default NextAuth({
  ...config,
  adapter: getAdapter(),
  providers: [...config.providers, ...addCredentialsProvider()],
  session: {
    strategy: 'jwt',
  },
});

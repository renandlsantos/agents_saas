import NextAuth from 'next-auth';

import { authEnv } from '@/config/auth';
import { getServerDBConfig } from '@/config/db';
import { serverDB } from '@/database/server';

import { LobeNextAuthDbAdapter } from './adapter';
import config from './auth.config';
import credentialsProvider from './sso-providers/credentials';

const { NEXT_PUBLIC_ENABLED_SERVER_SERVICE } = getServerDBConfig();

// Add credentials provider if it's configured
const addCredentialsProvider = () => {
  if (!authEnv.NEXT_PUBLIC_ENABLE_NEXT_AUTH) return [];
  
  const hasCredentials = authEnv.NEXT_AUTH_SSO_PROVIDERS.split(/[,，]/)
    .some((provider) => provider.trim() === 'credentials');
    
  return hasCredentials ? [credentialsProvider.provider] : [];
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
  adapter: NEXT_PUBLIC_ENABLED_SERVER_SERVICE ? LobeNextAuthDbAdapter(serverDB) : undefined,
  providers: [...config.providers, ...addCredentialsProvider()],
  session: {
    strategy: 'jwt',
  },
});

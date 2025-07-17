import type { NextAuthConfig } from 'next-auth';

import { authEnv } from '@/config/auth';

import { ssoProviders } from './sso-providers';

export const initSSOProviders = () => {
  return authEnv.NEXT_PUBLIC_ENABLE_NEXT_AUTH
    ? authEnv.NEXT_AUTH_SSO_PROVIDERS.split(/[,，]/)
        .filter((provider) => {
          const trimmedProvider = provider.trim();
          // In this base config, we filter out credentials provider
          // It will be added separately in the Node.js runtime config
          return trimmedProvider !== 'credentials';
        })
        .map((provider) => {
          const trimmedProvider = provider.trim();
          const validProvider = ssoProviders.find((item) => item.id === trimmedProvider);

          if (validProvider) return validProvider.provider;

          throw new Error(`[NextAuth] provider ${provider} is not supported`);
        })
    : [];
};

// Notice this is only an object, not a full Auth.js instance
export default {
  callbacks: {
    // Note: Data processing order of callback: authorize --> jwt --> session
    async jwt({ token, user }) {
      try {
        // ref: https://authjs.dev/guides/extending-the-session#with-jwt
        if (user?.id) {
          token.userId = user?.id;
        }
        return token;
      } catch (error) {
        console.error('[NextAuth] JWT callback error:', error);
        return token;
      }
    },
    async session({ session, token, user }) {
      try {
        if (session.user) {
          // ref: https://authjs.dev/guides/extending-the-session#with-database
          if (user) {
            session.user.id = user.id;
          } else {
            session.user.id = (token.userId ?? session.user.id) as string;
          }
        }
        return session;
      } catch (error) {
        console.error('[NextAuth] Session callback error:', error);
        return session;
      }
    },
  },
  debug: authEnv.NEXT_AUTH_DEBUG || process.env.NODE_ENV === 'development',
  pages: {
    error: '/next-auth/error',
    signIn: '/next-auth/signin',
  },
  providers: initSSOProviders(),
  secret: authEnv.NEXT_AUTH_SECRET,
  trustHost: process.env?.AUTH_TRUST_HOST ? process.env.AUTH_TRUST_HOST === 'true' : true,
} satisfies NextAuthConfig;

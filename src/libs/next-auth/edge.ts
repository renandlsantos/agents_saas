import NextAuth from 'next-auth';

import authConfig from './auth.config.edge';

/**
 * NextAuth initialization for Edge Runtime
 *
 * This version uses an Edge-compatible configuration that excludes
 * providers requiring database access (like credentials provider).
 *
 * @example
 * ```ts
 * import NextAuthEdge from '@/libs/next-auth/edge';
 * const { auth } = NextAuthEdge;
 * ```
 *
 * @note
 * We currently use `jwt` strategy for session management.
 * So you don't need to import `signIn` or `signOut` from
 * this module, just import from `next-auth` directly.
 *
 * Inside react component
 * @example
 * ```ts
 * import { signOut } from 'next-auth/react';
 * signOut();
 * ```
 */
export default NextAuth(authConfig);

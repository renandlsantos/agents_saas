import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import debug from 'debug';
import { NextRequest, NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';

import { authEnv } from '@/config/auth';
import { LOBE_LOCALE_COOKIE } from '@/const/locale';
import { LOBE_THEME_APPEARANCE } from '@/const/theme';
import { appEnv } from '@/envs/app';
import NextAuthEdge from '@/libs/next-auth/edge';
import { Locales } from '@/locales/resources';
import { parseBrowserLanguage } from '@/utils/locale';
import { parseDefaultThemeFromCountry } from '@/utils/server/geo';
import { RouteVariants } from '@/utils/server/routeVariants';

import { OAUTH_AUTHORIZED } from './const/auth';
import { oidcEnv } from './envs/oidc';

// Create debug logger instances
const logDefault = debug('lobe-middleware:default');
const logNextAuth = debug('lobe-middleware:next-auth');
const logClerk = debug('lobe-middleware:clerk');

// OIDC session pre-sync constant
const OIDC_SESSION_HEADER = 'x-oidc-session-sync';

export const config = {
  matcher: [
    // include any files in the api or trpc folders that might have an extension
    '/(api|trpc|webapi)(.*)',
    // include the /
    '/',
    '/discover',
    '/discover(.*)',
    '/chat',
    '/chat(.*)',
    '/changelog(.*)',
    '/settings(.*)',
    '/files',
    '/files(.*)',
    '/repos(.*)',
    '/profile(.*)',
    '/me',
    '/me(.*)',
    '/documentation',
    '/documentation(.*)',
    '/admin',
    '/admin(.*)',

    '/login(.*)',
    '/signup(.*)',
    '/next-auth/(.*)',
    '/oauth(.*)',
    '/oidc(.*)',
    // ↓ cloud ↓
  ],
};

const backendApiEndpoints = [
  '/api/auth/[...nextauth]',
  '/api',
  '/trpc',
  '/webapi',
  '/oidc',
  '/_next',
];

// Helper function to calculate route variants
const calculateRouteVariants = (request: NextRequest) => {
  // 1. Read user preferences from cookies
  const theme =
    request.cookies.get(LOBE_THEME_APPEARANCE)?.value || parseDefaultThemeFromCountry(request);

  // if it's a new user, there's no cookie
  // So we need to use the fallback language parsed by accept-language
  // Check for locale preference: cookie > .env default > browser language
  const cookieLocale = request.cookies.get(LOBE_LOCALE_COOKIE)?.value;
  const envDefaultLocale = process.env.DEFAULT_LOCALE || 'pt-BR';
  const browserLanguage = parseBrowserLanguage(request.headers);

  const locale = (cookieLocale || envDefaultLocale || browserLanguage) as Locales;

  const ua = request.headers.get('user-agent');

  const device = new UAParser(ua || '').getDevice();

  // 2. Create normalized preference values
  const route = RouteVariants.serializeVariants({
    isMobile: device.type === 'mobile',
    locale,
    theme,
  });

  return { locale, theme, device, route, browserLanguage };
};

const defaultMiddleware = (request: NextRequest) => {
  const url = new URL(request.url);
  logDefault('Processing request: %s %s', request.method, request.url);

  // skip all api requests and admin routes
  if (
    backendApiEndpoints.some((path) => url.pathname.startsWith(path)) ||
    url.pathname.startsWith('/admin')
  ) {
    logDefault('Skipping API/Admin request: %s', url.pathname);
    return NextResponse.next();
  }

  const { locale, theme, device, route, browserLanguage } = calculateRouteVariants(request);

  logDefault('User preferences: %O', {
    browserLanguage,
    deviceType: device.type,
    hasCookies: {
      locale: !!request.cookies.get(LOBE_LOCALE_COOKIE)?.value,
      theme: !!request.cookies.get(LOBE_THEME_APPEARANCE)?.value,
    },
    locale,
    theme,
  });

  logDefault('Serialized route variant: %s', route);

  // if app is in docker, rewrite to self container
  // https://github.com/lobehub/lobe-chat/issues/5876
  if (appEnv.MIDDLEWARE_REWRITE_THROUGH_LOCAL) {
    logDefault('Local container rewrite enabled: %O', {
      host: '127.0.0.1',
      original: url.toString(),
      port: process.env.PORT || '3210',
      protocol: 'http',
    });

    url.protocol = 'http';
    url.host = '127.0.0.1';
    url.port = process.env.PORT || '3210';
  }

  // Internal rewrite to variant path while keeping clean URLs
  const internalPathname = `/${route}` + (url.pathname === '/' ? '' : url.pathname);

  logDefault('URL rewrite: %O', {
    internalPathname: internalPathname,
    originalPathname: url.pathname,
    route: route,
  });

  // Create a new URL for internal rewriting
  const rewriteUrl = new URL(url);
  rewriteUrl.pathname = internalPathname;

  // Rewrite internally but keep the original clean URL visible to the user
  const response = NextResponse.rewrite(rewriteUrl, { status: 200 });

  // Set locale cookie if not present
  if (!request.cookies.get(LOBE_LOCALE_COOKIE)?.value && locale) {
    response.cookies.set(LOBE_LOCALE_COOKIE, locale, {
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
};

const isPublicRoute = createRouteMatcher([
  '/api/auth(.*)',
  '/trpc(.*)',
  // next auth
  '/next-auth/(.*)',
  // clerk
  '/login',
  '/signup',
]);

const isProtectedRoute = createRouteMatcher([
  '/settings(.*)',
  '/files(.*)',
  '/onboard(.*)',
  '/oauth(.*)',
  '/admin',
  '/admin(.*)',
  // ↓ cloud ↓
]);

// Initialize an Edge compatible NextAuth middleware
const nextAuthMiddleware = NextAuthEdge.auth((req) => {
  logNextAuth('NextAuth middleware processing request: %s %s', req.method, req.url);

  const response = defaultMiddleware(req);

  // when enable auth protection, only public route is not protected, others are all protected
  const isProtected = appEnv.ENABLE_AUTH_PROTECTION ? !isPublicRoute(req) : isProtectedRoute(req);

  logNextAuth('Route protection status: %s, %s', req.url, isProtected ? 'protected' : 'public');

  // Just check if session exists
  const session = req.auth;

  // Check if next-auth throws errors
  // refs: https://github.com/lobehub/lobe-chat/pull/1323
  const isLoggedIn = !!session?.expires;

  logNextAuth('NextAuth session status: %O', {
    expires: session?.expires,
    isLoggedIn,
    userId: session?.user?.id,
  });

  // Remove & amend OAuth authorized header
  response.headers.delete(OAUTH_AUTHORIZED);
  if (isLoggedIn) {
    logNextAuth('Setting auth header: %s = %s', OAUTH_AUTHORIZED, 'true');
    response.headers.set(OAUTH_AUTHORIZED, 'true');

    // If OIDC is enabled and user is logged in, add OIDC session pre-sync header
    if (oidcEnv.ENABLE_OIDC && session?.user?.id) {
      logNextAuth('OIDC session pre-sync: Setting %s = %s', OIDC_SESSION_HEADER, session.user.id);
      response.headers.set(OIDC_SESSION_HEADER, session.user.id);
    }
  } else {
    // If request a protected route, redirect to sign-in page
    // ref: https://authjs.dev/getting-started/session-management/protecting
    if (isProtected) {
      logNextAuth('Request a protected route, redirecting to sign-in page');

      // Create login URL without variants in the visible URL
      const nextLoginUrl = new URL(`/next-auth/signin`, req.nextUrl.origin);
      nextLoginUrl.searchParams.set('callbackUrl', req.nextUrl.href);

      logNextAuth('Redirecting to: %s', nextLoginUrl.toString());
      return Response.redirect(nextLoginUrl);
    }
    logNextAuth('Request a free route but not login, allow visit without auth header');
  }

  return response;
});

const clerkAuthMiddleware = clerkMiddleware(
  async (auth, req) => {
    logClerk('Clerk middleware processing request: %s %s', req.method, req.url);

    // when enable auth protection, only public route is not protected, others are all protected
    const isProtected = appEnv.ENABLE_AUTH_PROTECTION ? !isPublicRoute(req) : isProtectedRoute(req);

    logClerk('Route protection status: %s, %s', req.url, isProtected ? 'protected' : 'public');

    if (isProtected) {
      logClerk('Protecting route: %s', req.url);
      await auth.protect();
    }

    const response = defaultMiddleware(req);

    const data = await auth();
    logClerk('Clerk auth status: %O', {
      isSignedIn: !!data.userId,
      userId: data.userId,
    });

    // If OIDC is enabled and Clerk user is logged in, add OIDC session pre-sync header
    if (oidcEnv.ENABLE_OIDC && data.userId) {
      logClerk('OIDC session pre-sync: Setting %s = %s', OIDC_SESSION_HEADER, data.userId);
      response.headers.set(OIDC_SESSION_HEADER, data.userId);
    } else if (oidcEnv.ENABLE_OIDC) {
      logClerk('No Clerk user detected, not setting OIDC session sync header');
    }

    return response;
  },
  {
    // https://github.com/lobehub/lobe-chat/pull/3084
    clockSkewInMs: 60 * 60 * 1000,
    signInUrl: '/login',
    signUpUrl: '/signup',
  },
);

logDefault('Middleware configuration: %O', {
  enableAuthProtection: appEnv.ENABLE_AUTH_PROTECTION,
  enableClerk: authEnv.NEXT_PUBLIC_ENABLE_CLERK_AUTH,
  enableNextAuth: authEnv.NEXT_PUBLIC_ENABLE_NEXT_AUTH,
  enableOIDC: oidcEnv.ENABLE_OIDC,
});

export default authEnv.NEXT_PUBLIC_ENABLE_CLERK_AUTH
  ? clerkAuthMiddleware
  : authEnv.NEXT_PUBLIC_ENABLE_NEXT_AUTH
    ? nextAuthMiddleware
    : defaultMiddleware;

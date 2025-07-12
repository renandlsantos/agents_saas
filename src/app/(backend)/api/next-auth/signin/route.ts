import { NextRequest, NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';

import { LOBE_LOCALE_COOKIE } from '@/const/locale';
import { LOBE_THEME_APPEARANCE } from '@/const/theme';
import { Locales } from '@/locales/resources';
import { parseBrowserLanguage } from '@/utils/locale';
import { parseDefaultThemeFromCountry } from '@/utils/server/geo';
import { RouteVariants } from '@/utils/server/routeVariants';

export async function GET(request: NextRequest) {
  // Get callback URL from query params
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');

  // Calculate route variants
  const theme =
    request.cookies.get(LOBE_THEME_APPEARANCE)?.value || parseDefaultThemeFromCountry(request);

  const cookieLocale = request.cookies.get(LOBE_LOCALE_COOKIE)?.value;
  const envDefaultLocale = process.env.DEFAULT_LOCALE || 'pt-BR';
  const browserLanguage = parseBrowserLanguage(request.headers);

  const locale = (cookieLocale || envDefaultLocale || browserLanguage) as Locales;

  const ua = request.headers.get('user-agent');
  const device = new UAParser(ua || '').getDevice();

  const route = RouteVariants.serializeVariants({
    isMobile: device.type === 'mobile',
    locale,
    theme,
  });

  // Construct the actual signin URL with variants
  const signinUrl = new URL(`/${route}/next-auth/signin`, request.nextUrl.origin);

  // Preserve the callback URL
  if (callbackUrl) {
    signinUrl.searchParams.set('callbackUrl', callbackUrl);
  }

  // Redirect to the proper signin page with variants
  return NextResponse.redirect(signinUrl);
}

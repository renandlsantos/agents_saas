import { NextRequest, NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';

import { LOBE_LOCALE_COOKIE } from '@/const/locale';
import { LOBE_THEME_APPEARANCE } from '@/const/theme';
import { Locales } from '@/locales/resources';
import { parseBrowserLanguage } from '@/utils/locale';
import { parseDefaultThemeFromCountry } from '@/utils/server/geo';
import { RouteVariants } from '@/utils/server/routeVariants';

export async function GET(request: NextRequest) {
  // Get error type from query params
  const error = request.nextUrl.searchParams.get('error');

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

  // Construct the actual error URL with variants
  const errorUrl = new URL(`/${route}/next-auth/error`, request.nextUrl.origin);

  // Preserve the error type
  if (error) {
    errorUrl.searchParams.set('error', error);
  }

  // Redirect to the proper error page with variants
  return NextResponse.redirect(errorUrl);
}

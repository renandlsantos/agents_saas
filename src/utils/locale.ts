import { resolveAcceptLanguage } from 'resolve-accept-language';

import { DEFAULT_LANG } from '@/const/locale';
import { Locales, locales, normalizeLocale } from '@/locales/resources';
import { RouteVariants } from '@/utils/server/routeVariants';

export const getAntdLocale = async (lang?: string) => {
  const normalLang = normalizeLocale(lang);

  const { default: locale } = await import(`antd/locale/${normalLang.replace('-', '_')}.js`);

  return locale;
};

/**
 * Parse the browser language and return the fallback language
 */
export const parseBrowserLanguage = (headers: Headers, defaultLang: string = DEFAULT_LANG) => {
  // if the default language is not 'en-US', just return the default language as fallback lang
  if (defaultLang !== 'en-US') return defaultLang;

  /**
   * The arguments are as follows:
   *
   * 1) The HTTP accept-language header.
   * 2) The available locales (they must contain the default locale).
   * 3) The default locale.
   */
  const browserLang: string = resolveAcceptLanguage(
    headers.get('accept-language') || '',
    locales,
    defaultLang,
  );

  return browserLang;
};

/**
 * Parse the page locale from the URL and search params
 * @param props
 */
export const parsePageLocale = async (props: {
  params: Promise<{ variants: string }>;
  searchParams: Promise<any>;
}) => {
  const searchParams = await props.searchParams;

  const browserLocale = await RouteVariants.getLocale(props);
  return normalizeLocale(searchParams?.hl || browserLocale) as Locales;
};

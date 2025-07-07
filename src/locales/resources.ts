import { DEFAULT_LANG } from '@/const/locale';

import resources from './default';

export const locales = ['en-US', 'es-ES', 'pt-BR'] as const;

export type DefaultResources = typeof resources;
export type NS = keyof DefaultResources;
export type Locales = (typeof locales)[number];

export const normalizeLocale = (locale?: string): string => {
  if (!locale) return DEFAULT_LANG;

  // Handle common locale variations
  if (locale.startsWith('pt')) return 'pt-BR';
  if (locale.startsWith('es')) return 'es-ES';
  if (locale.startsWith('en')) return 'en-US';

  // Check exact matches
  for (const l of locales) {
    if (l === locale) {
      return l;
    }
  }

  return DEFAULT_LANG;
};

type LocaleOptions = {
  label: string;
  value: Locales;
}[];

export const localeOptions: LocaleOptions = [
  {
    label: 'English',
    value: 'en-US',
  },
  {
    label: 'Español',
    value: 'es-ES',
  },
  {
    label: 'Português',
    value: 'pt-BR',
  },
] as LocaleOptions;

export const supportLocales: string[] = [...locales, 'en', 'es', 'pt'];

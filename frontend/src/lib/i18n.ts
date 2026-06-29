import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = [
  'es', 'en', 'pt', 'fr', 'de', 'it',
  'zh-CN', 'ja', 'ko', 'ar', 'hi', 'ru', 'tr', 'nl', 'pl',
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const rtlLocales: Locale[] = ['ar'];

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export default getRequestConfig(async ({ locale }) => {
  const safeLocale = isValidLocale(locale ?? '') ? (locale as Locale) : defaultLocale;
  const messages = (await import(`../../messages/${safeLocale}.json`)).default as Record<string, unknown>;
  return { messages };
});

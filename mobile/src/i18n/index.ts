import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from './locales/es';
import en from './locales/en';

const LOCALE_KEY = '@ezzeshop_locale';

const resources = {
  es: { translation: es },
  en: { translation: en },
  // Los demás idiomas usan el fallback en inglés hasta que se añadan
};

export type SupportedLocale = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it' | 'zh-CN' | 'ja' | 'ko' | 'ar' | 'hi' | 'ru' | 'tr' | 'nl' | 'pl';

export const ALL_LOCALES: { code: SupportedLocale; label: string; rtl: boolean }[] = [
  { code: 'es', label: 'Español', rtl: false },
  { code: 'en', label: 'English', rtl: false },
  { code: 'pt', label: 'Português', rtl: false },
  { code: 'fr', label: 'Français', rtl: false },
  { code: 'de', label: 'Deutsch', rtl: false },
  { code: 'it', label: 'Italiano', rtl: false },
  { code: 'zh-CN', label: '中文', rtl: false },
  { code: 'ja', label: '日本語', rtl: false },
  { code: 'ko', label: '한국어', rtl: false },
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'hi', label: 'हिन्दी', rtl: false },
  { code: 'ru', label: 'Русский', rtl: false },
  { code: 'tr', label: 'Türkçe', rtl: false },
  { code: 'nl', label: 'Nederlands', rtl: false },
  { code: 'pl', label: 'Polski', rtl: false },
];

async function getInitialLocale(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(LOCALE_KEY);
    if (saved) return saved;
  } catch { /* ignore */ }
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
  return Object.keys(resources).includes(deviceLocale) ? deviceLocale : 'en';
}

export async function initI18n(): Promise<void> {
  const locale = await getInitialLocale();
  await i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}

export async function changeLocale(locale: SupportedLocale): Promise<void> {
  await i18n.changeLanguage(locale);
  await AsyncStorage.setItem(LOCALE_KEY, locale);
}

export default i18n;

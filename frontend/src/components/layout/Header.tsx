'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { Sun, Moon, Globe, Menu, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { locales, type Locale } from '@/lib/i18n';
import { useRouter, usePathname } from 'next/navigation';

const LOCALE_LABELS: Record<string, string> = {
  es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch',
  it: 'Italiano', 'zh-CN': '中文', ja: '日本語', ko: '한국어', ar: 'العربية',
  hi: 'हिन्दी', ru: 'Русский', tr: 'Türkçe', nl: 'Nederlands', pl: 'Polski',
};

export function Header() {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  function switchLocale(newLocale: Locale) {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
    setLangOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">EzzeShop</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href={`/${locale}/creators`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('creators')}
          </Link>
          <Link href={`/${locale}/tv`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('tv')}
          </Link>
          <Link href={`/${locale}/pricing`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('pricing')}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? tc('light_mode') : tc('dark_mode')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Language selector */}
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setLangOpen(!langOpen)} aria-label={tc('select_language')}>
              <Globe className="h-4 w-4" />
            </Button>
            {langOpen && (
              <div className="absolute end-0 top-12 z-50 max-h-80 w-48 overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
                {locales.map((l) => (
                  <button
                    key={l}
                    className={`w-full px-4 py-2 text-start text-sm hover:bg-muted transition-colors ${l === locale ? 'text-primary font-medium' : ''}`}
                    onClick={() => switchLocale(l)}
                  >
                    {LOCALE_LABELS[l]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth buttons */}
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link href={`/${locale}/dashboard`}>
                <Button variant="outline" size="sm">{t('dashboard')}</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => void logout()}>{t('logout')}</Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href={`/${locale}/login`}>
                <Button variant="ghost" size="sm">{t('login')}</Button>
              </Link>
              <Link href={`/${locale}/register`}>
                <Button variant="gradient" size="sm">{t('register')}</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border md:hidden">
          <nav className="flex flex-col gap-1 p-4">
            <Link href={`/${locale}/creators`} className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>{t('creators')}</Link>
            <Link href={`/${locale}/tv`} className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>{t('tv')}</Link>
            <Link href={`/${locale}/pricing`} className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>{t('pricing')}</Link>
            <div className="my-2 border-t border-border" />
            {user ? (
              <>
                <Link href={`/${locale}/dashboard`} className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>{t('dashboard')}</Link>
                <button className="rounded-lg px-3 py-2 text-start text-sm text-destructive hover:bg-muted" onClick={() => { void logout(); setMobileOpen(false); }}>{t('logout')}</button>
              </>
            ) : (
              <>
                <Link href={`/${locale}/login`} className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setMobileOpen(false)}>{t('login')}</Link>
                <Link href={`/${locale}/register`} className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-muted" onClick={() => setMobileOpen(false)}>{t('register')}</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

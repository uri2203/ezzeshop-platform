'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import type { AxiosError } from 'axios';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? tc('error'));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">EzzeShop</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          <h1 className="mb-2 text-2xl font-bold">{t('login_title')}</h1>
          <p className="mb-6 text-sm text-muted-foreground">{t('login_subtitle')}</p>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium">{t('password')}</label>
                <Link href={`/${locale}/reset-password`} className="text-xs text-primary hover:underline">
                  {t('forgot_password')}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pe-10 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              {t('login_btn')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('no_account')}{' '}
            <Link href={`/${locale}/register`} className="font-medium text-primary hover:underline">
              {t('sign_up')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Zap, Building2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import type { AxiosError } from 'axios';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    role: '' as 'client' | 'creator' | '',
  });
  const [error, setError] = useState('');

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.role) { setError('Por favor selecciona tu tipo de cuenta'); return; }
    setError('');
    try {
      await register({ ...form, role: form.role, locale });
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? tc('error'));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">EzzeShop</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          <h1 className="mb-2 text-2xl font-bold">{t('register_title')}</h1>
          <p className="mb-6 text-sm text-muted-foreground">{t('register_subtitle')}</p>

          {/* Role selector */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            {[
              { value: 'client', label: t('iam_client'), icon: Building2 },
              { value: 'creator', label: t('iam_creator'), icon: Video },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => update('role', value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center text-sm transition-all',
                  form.role === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:border-primary/50',
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="font-medium text-xs leading-tight">{label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t('first_name')}</label>
                <input
                  type="text" required value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t('last_name')}</label>
                <input
                  type="text" required value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('email')}</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('password')}</label>
              <input
                type="password" required minLength={8} value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              {t('register_btn')}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t('terms')}{' '}
            <Link href={`/${locale}/terms`} className="text-primary hover:underline">{t('terms_link')}</Link>
            {' '}{t('and')}{' '}
            <Link href={`/${locale}/privacy`} className="text-primary hover:underline">{t('privacy')}</Link>
          </p>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t('have_account')}{' '}
            <Link href={`/${locale}/login`} className="font-medium text-primary hover:underline">{t('sign_in')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

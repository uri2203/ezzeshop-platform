'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Wand2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import api from '@/lib/api';
import type { AxiosError } from 'axios';

const OBJECTIVES = ['brand_awareness', 'traffic', 'conversions', 'app_installs', 'reach'] as const;
const AD_FORMATS = ['pre_roll', 'mid_roll', 'banner', 'sponsored_content', 'story'] as const;
const NICHES = ['gaming', 'lifestyle', 'tech', 'music', 'sports', 'news', 'education', 'cooking', 'travel', 'beauty', 'fitness', 'business', 'art', 'comedy'];

export default function NewCampaignPage() {
  const t = useTranslations('campaign');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState({
    title: '', description: '', objective: 'brand_awareness' as typeof OBJECTIVES[number],
    adFormat: 'pre_roll' as typeof AD_FORMATS[number],
    budgetTotal: '', currency: 'USD',
    targetNiches: [] as string[], targetCountries: [] as string[],
    startDate: '', endDate: '', landingUrl: '', callToAction: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleNiche(niche: string) {
    setForm((f) => ({
      ...f,
      targetNiches: f.targetNiches.includes(niche)
        ? f.targetNiches.filter((n) => n !== niche)
        : [...f.targetNiches, niche],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<{ data: { id: string } }>('/campaigns', {
        ...form,
        budgetTotal: parseFloat(form.budgetTotal),
      });
      router.push(`/${locale}/campaigns/${data.data.id}`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message ?? tc('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href={`/${locale}/dashboard`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold">{t('create')}</h1>
        </div>

        {/* AI tip */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4">
          <Wand2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500" />
          <p className="text-sm text-muted-foreground">
            ¿Prefieres que el agente IA te guíe?{' '}
            <Link href={`/${locale}/agent`} className="text-purple-500 hover:underline font-medium">
              Crea la campaña con IA →
            </Link>
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          {/* Basic info */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Información básica</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t('title')} *</label>
                <input
                  required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder="Mi campaña de verano 2025"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t('description')}</label>
                <textarea
                  rows={3} value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Objective */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t('objective')}</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj} type="button"
                  onClick={() => setForm((f) => ({ ...f, objective: obj }))}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm transition-all ${form.objective === obj ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-primary/50'}`}
                >
                  {t(`obj_${obj.replace('brand_awareness', 'awareness').replace('app_installs', 'installs')}` as Parameters<typeof t>[0])}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t('budget')}</h2>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium">{t('budget')} *</label>
                <input
                  type="number" required min="1" step="0.01" value={form.budgetTotal}
                  onChange={(e) => setForm((f) => ({ ...f, budgetTotal: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder="1000"
                />
              </div>
              <div className="w-28">
                <label className="mb-1.5 block text-sm font-medium">{t('currency')}</label>
                <select
                  value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                >
                  {['USD', 'EUR', 'MXN', 'BRL', 'GBP'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Niches */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t('niches')}</h2>
            <div className="flex flex-wrap gap-2">
              {NICHES.map((niche) => (
                <button
                  key={niche} type="button" onClick={() => toggleNiche(niche)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-all ${form.targetNiches.includes(niche) ? 'border-primary bg-primary text-white' : 'border-border hover:border-primary/50'}`}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Fechas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t('start_date')}</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t('end_date')}</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>
          </div>

          <Button type="submit" variant="gradient" size="lg" className="w-full" isLoading={loading}>
            {t('save')}
          </Button>
        </form>
      </main>
    </div>
  );
}

'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Plus, TrendingUp, Users, DollarSign, Eye, Zap, KeyRound, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency, formatNumber } from '@/lib/utils';

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string; icon: React.ElementType; trend?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          {trend && <p className="mt-1 text-xs text-emerald-500">{trend}</p>}
        </div>
        <div className="rounded-xl bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { user } = useAuthStore();

  const isClient = user?.role === 'client';
  const isCreator = user?.role === 'creator';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {t('welcome')}, {user?.firstName ?? ''}! 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('overview')}</p>
          </div>
          {isClient && (
            <Link href={`/${locale}/campaigns/new`}>
              <Button variant="gradient" className="gap-2">
                <Plus className="h-4 w-4" /> {t('create_campaign')}
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isClient && (
            <>
              <StatCard label={t('total_spent')} value={formatCurrency(0)} icon={DollarSign} />
              <StatCard label={t('active_campaigns')} value="0" icon={TrendingUp} />
              <StatCard label={t('total_matches')} value="0" icon={Users} />
              <StatCard label={t('pending_matches')} value="0" icon={Zap} />
            </>
          )}
          {isCreator && (
            <>
              <StatCard label={t('total_earned')} value={formatCurrency(0)} icon={DollarSign} />
              <StatCard label={t('pending_matches')} value="0" icon={Zap} />
              <StatCard label={t('views_this_month')} value={formatNumber(0)} icon={Eye} />
              <StatCard label={t('campaigns_count' as keyof typeof t)} value="0" icon={TrendingUp} />
            </>
          )}
        </div>

        {/* Empty states */}
        {isClient && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">{t('no_campaigns')}</h2>
            <p className="mb-6 max-w-md mx-auto text-muted-foreground">{t('no_campaigns_desc')}</p>
            <Link href={`/${locale}/campaigns/new`}>
              <Button variant="gradient">{t('create_campaign')}</Button>
            </Link>
          </div>
        )}

        {isAdmin && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h2 className="mb-1 font-semibold text-foreground">Configuración de APIs pendiente</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Algunos servicios externos (IA, pagos, email) pueden no estar configurados.
                  Accede al panel de configuración para añadir las API keys.
                </p>
                <Link href={`/${locale}/settings`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <KeyRound className="h-4 w-4" />
                    Configurar APIs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {isCreator && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">{t('no_matches')}</h2>
            <p className="mb-6 max-w-md mx-auto text-muted-foreground">{t('no_matches_desc')}</p>
            <Link href={`/${locale}/profile`}>
              <Button variant="gradient">Completar perfil</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

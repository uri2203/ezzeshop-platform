import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ArrowRight, Play, Zap, Users, Target, TrendingUp } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';

function HeroSection() {
  const t = useTranslations('hero');
  const tn = useTranslations('nav');

  return (
    <section className="relative overflow-hidden pb-24 pt-16">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-400">
          <Zap className="h-3.5 w-3.5" />
          {t('badge')}
        </div>

        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          {t('title').split(' ').slice(0, 3).join(' ')}{' '}
          <span className="gradient-text">{t('title').split(' ').slice(3).join(' ')}</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
          {t('subtitle')}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href={`/register?role=client`}>
            <Button variant="gradient" size="lg" className="gap-2">
              {t('cta_client')} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/register?role=creator`}>
            <Button variant="outline" size="lg">
              {t('cta_creator')}
            </Button>
          </Link>
          <Link href={`/tv`}>
            <Button variant="ghost" size="lg" className="gap-2">
              <Play className="h-4 w-4" /> {t('cta_watch')}
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { label: t('stat_creators'), value: '50K+', icon: Users },
            { label: t('stat_brands'), value: '5K+', icon: Target },
            { label: t('stat_campaigns'), value: '120K+', icon: TrendingUp },
            { label: t('stat_countries'), value: '85+', icon: Zap },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-border/50 bg-card/50 p-6 text-center backdrop-blur-sm">
              <Icon className="mx-auto mb-3 h-6 w-6 text-primary" />
              <div className="text-3xl font-bold gradient-text">{value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main>
      <Header />
      <HeroSection />
    </main>
  );
}

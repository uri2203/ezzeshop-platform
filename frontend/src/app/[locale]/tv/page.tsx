'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search, Play, Eye, Tv } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import api from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import type { StreamingContent } from '@/types';

const CATEGORIES = [
  'entertainment', 'gaming', 'music', 'sports', 'news',
  'education', 'tech', 'lifestyle', 'cooking', 'travel',
  'beauty', 'fitness', 'business', 'art', 'comedy',
] as const;

function ContentCard({ content }: { content: StreamingContent }) {
  const locale = useLocale();
  const t = useTranslations('tv');
  return (
    <Link href={`/${locale}/tv/${content.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-muted aspect-video mb-3">
        {content.thumbnail_url ? (
          <img src={content.thumbnail_url} alt={content.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center gradient-brand">
            <Tv className="h-12 w-12 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Play className="h-5 w-5 fill-white text-white ms-0.5" />
          </div>
        </div>
        {content.duration_seconds && (
          <div className="absolute bottom-2 end-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white tabular-nums">
            {Math.floor(content.duration_seconds / 60)}:{String(content.duration_seconds % 60).padStart(2, '0')}
          </div>
        )}
      </div>
      <h3 className="font-medium line-clamp-2 text-sm leading-tight group-hover:text-primary transition-colors">
        {content.title}
      </h3>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Eye className="h-3 w-3" />
        <span>{formatNumber(content.views)} {t('views')}</span>
      </div>
    </Link>
  );
}

export default function TVPage() {
  const t = useTranslations('tv');
  const [contents, setContents] = useState<StreamingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      const { data } = await api.get<{ data: StreamingContent[] }>(`/streaming?${params.toString()}`);
      setContents(data.data);
    } catch {
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => { void load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand">
            <Tv className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-4xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8 mx-auto max-w-lg">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('search')}
              className="w-full rounded-2xl border border-input bg-card px-4 py-3 ps-12 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </form>

        {/* Categories */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setCategory('')}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${!category ? 'gradient-brand text-white' : 'border border-border hover:border-primary/50'}`}
          >
            {t('categories')}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === category ? '' : cat)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm transition-all ${category === cat ? 'gradient-brand text-white' : 'border border-border hover:border-primary/50'}`}
            >
              {t(`cat_${cat}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>

        {/* Content grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-video rounded-xl bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : contents.length === 0 ? (
          <div className="py-24 text-center">
            <Tv className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t('no_content')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {contents.map((c) => <ContentCard key={c.id} content={c} />)}
          </div>
        )}
      </main>
    </div>
  );
}

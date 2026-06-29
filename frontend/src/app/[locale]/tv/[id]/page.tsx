'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { VideoPlayer } from '@/components/streaming/VideoPlayer';
import { Header } from '@/components/layout/Header';
import api from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';
import type { StreamingContent } from '@/types';

interface PageProps { params: { id: string; locale: string } }

export default function VideoPage({ params }: PageProps) {
  const t = useTranslations('tv');
  const locale = useLocale();
  const [content, setContent] = useState<StreamingContent & { creator_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<{ data: StreamingContent & { creator_name?: string } }>(`/streaming/${params.id}`);
        setContent(data.data);
      } catch {
        setContent(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
          <div className="aspect-video rounded-2xl bg-muted mb-4" />
          <div className="h-6 w-3/4 rounded bg-muted mb-2" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-muted-foreground">Contenido no encontrado</p>
          <Link href={`/${locale}/tv`} className="mt-4 text-primary hover:underline">← {t('browse')}</Link>
        </div>
      </div>
    );
  }

  const videoSrc = content.video_url ?? '/sample-video.mp4';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Link href={`/${locale}/tv`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {t('browse')}
        </Link>

        {/* Player */}
        <VideoPlayer
          src={videoSrc}
          hlsSrc={content.hls_url ?? undefined}
          poster={content.thumbnail_url ?? undefined}
          title={content.title}
          className="mb-6 w-full"
        />

        {/* Info */}
        <div className="mb-4">
          <h1 className="mb-2 text-2xl font-bold">{content.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {content.creator_name && <span className="font-medium text-foreground">{content.creator_name}</span>}
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> {formatNumber(content.views)} {t('views')}
            </span>
            {content.published_at && <span>{formatDate(content.published_at, locale)}</span>}
            <span className="rounded-full border border-border px-2 py-0.5 text-xs capitalize">{content.category}</span>
          </div>
        </div>

        {content.description && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{content.description}</p>
          </div>
        )}

        {content.tags && content.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

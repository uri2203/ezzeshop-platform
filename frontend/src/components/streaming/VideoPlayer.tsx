'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  hlsSrc?: string;
  poster?: string;
  title?: string;
  onAdSlot?: () => void;
  className?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoPlayer({ src, hlsSrc, poster, title, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    async function initHls() {
      const activeUrl = hlsSrc ?? src;
      if (hlsSrc && typeof window !== 'undefined') {
        const Hls = (await import('hls.js')).default;
        if (Hls.isSupported()) {
          const hls = new Hls({ maxBufferLength: 30 });
          hls.loadSource(hlsSrc);
          hls.attachMedia(video!);
          return () => hls.destroy();
        }
      }
      if (video) video.src = activeUrl;
      return undefined;
    }

    const cleanup = initHls();
    return () => { void cleanup.then((fn) => fn?.()); };
  }, [src, hlsSrc]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { void v.play().then(() => setPlaying(true)); }
  }

  function handleMouseMove() {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    const t = (parseFloat(e.target.value) / 100) * duration;
    v.currentTime = t;
    setCurrentTime(t);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      void containerRef.current?.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn('group relative overflow-hidden rounded-2xl bg-black', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
    >
      <video
        ref={videoRef}
        poster={poster}
        muted={muted}
        className="w-full aspect-video"
        onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); setLoading(false); }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={togglePlay}
        playsInline
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}

      {/* Controls overlay */}
      <div className={cn(
        'absolute inset-0 flex flex-col justify-between p-4 transition-opacity duration-300',
        showControls ? 'opacity-100' : 'opacity-0',
        'bg-gradient-to-t from-black/80 via-transparent to-black/30',
      )}>
        {/* Title */}
        {title && <p className="text-sm font-medium text-white/90 line-clamp-1">{title}</p>}

        {/* Bottom controls */}
        <div className="space-y-2">
          {/* Progress bar */}
          <input
            type="range" min="0" max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={seek}
            className="w-full h-1 accent-purple-500 cursor-pointer"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-purple-400 transition-colors">
                {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
              </button>
              <button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }} className="text-white hover:text-purple-400 transition-colors">
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <span className="text-xs text-white/80 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <button onClick={toggleFullscreen} className="text-white hover:text-purple-400 transition-colors">
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Play button overlay when paused */}
      {!playing && !loading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-brand shadow-2xl transition-transform hover:scale-110">
            <Play className="h-7 w-7 fill-white text-white ms-1" />
          </div>
        </button>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  Server,
} from "lucide-react";
import type { Episode, EpisodeMeta } from "@/lib/types";
import { getProgressFor, saveProgress } from "@/lib/progress";
import { formatCount, toArabicDigits } from "@/lib/format";

interface PlayerProps {
  slug: string;
  epNumber: number;
  episode: Episode;
  anime: {
    slug: string;
    title: string;
    titleArabic?: string;
    coverImage: string;
  };
  episodes: EpisodeMeta[];
}

type PlaybackMode = "hls" | "embed" | "none";

interface HlsLevel {
  height: number;
  index: number;
}

export default function Player({
  slug,
  epNumber,
  episode,
  anime,
  episodes,
}: PlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<InstanceType<typeof import("hls.js").default> | null>(null);
  const [serverIdx, setServerIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<HlsLevel[]>([]);
  const [levelIdx, setLevelIdx] = useState(-1);
  const [restored, setRestored] = useState(false);
  const lastSave = useRef(0);

  const servers = episode.servers ?? [];
  const server = servers[serverIdx];

  const mode: PlaybackMode = useMemo(() => {
    if (!server) return "none";
    const src = server.url || server.embedUrl || "";
    if (server.type === "hls" || src.includes(".m3u8")) return "hls";
    if (server.embedUrl || src.includes("http")) return "embed";
    return "none";
  }, [server]);

  const source = server ? server.url || server.embedUrl || "" : "";

  const nextEp = episodes.find((e) => e.number === epNumber + 1);
  const prevEp = episodes.find((e) => e.number === epNumber - 1);

  /* ------------------------- progress persistence ------------------------ */
  const persistProgress = useCallback(
    (time: number, duration: number) => {
      const now = Date.now();
      if (now - lastSave.current < 4000) return;
      lastSave.current = now;
      saveProgress({
        slug,
        ep: epNumber,
        time,
        duration,
        animeTitle: anime.title,
        animeArabic: anime.titleArabic,
        coverImage: anime.coverImage,
      });
    },
    [slug, epNumber, anime]
  );

  /* ------------------------------ playback ------------------------------- */
  const destroy = useCallback(() => {
    const hls = hlsRef.current;
    if (hls) {
      hls.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    setLevels([]);
    setLevelIdx(-1);
  }, []);

  useEffect(() => {
    if (!server || mode === "none") {
      setLoading(false);
      return;
    }
    if (mode === "embed") {
      setLoading(false);
      setPlaying(true);
      return;
    }

    setLoading(true);
    setError(null);
    setRestored(false);
    destroy();

    const video: HTMLVideoElement | null = videoRef.current;
    if (!video) return;
    const vid = video;

    let cancelled = false;
    let hls: InstanceType<typeof import("hls.js").default> | null = null;

    async function setup() {
      const src = source;
      try {
        const canNative = vid.canPlayType("application/vnd.apple.mpegurl");
        if (canNative) {
          vid.src = src;
        } else {
          const Hls = (await import("hls.js")).default;
          if (cancelled) return;
          hls = new Hls({
            enableWorker: true,
            backBufferLength: 90,
            maxBufferLength: 60,
            capLevelToPlayerSize: true,
          });
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(vid);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (cancelled) return;
            setLevels(
              (hls?.levels ?? []).map((l, i) => ({ height: l.height, index: i }))
            );
          });
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (cancelled) return;
            if (!data.fatal) return;
            setError("تعذّر تشغيل هذه الحلقة من السيرفر الحالي، جرّب سيرفراً آخر.");
            setLoading(false);
          });
        }
      } catch {
        if (!cancelled) {
          setError("تعذّر تهيئة المشغّل، جرّب سيرفراً آخر.");
          setLoading(false);
        }
      }
    }
    setup();

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
    };
  }, [server, mode, source, destroy]);

  /* restore saved position once metadata is ready */
  function onLoadedMetadata() {
    const video = videoRef.current;
    if (!video || restored) return;
    setRestored(true);
    const saved = getProgressFor(slug);
    if (
      saved &&
      saved.ep === epNumber &&
      saved.time > 5 &&
      video.duration > 0 &&
      saved.time < video.duration - 8
    ) {
      video.currentTime = saved.time;
    }
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setError("اضغط زر التشغيل مرة أخرى"));
    else video.pause();
  }

  function pickLevel(idx: number) {
    const hls = hlsRef.current;
    setLevelIdx(idx);
    if (hls) hls.currentLevel = idx;
  }

  function goFullscreen() {
    const el = videoRef.current?.parentElement as HTMLDivElement | null;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen().catch(() => undefined);
  }

  return (
    <div>
      {/* header row */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white sm:text-xl">
            {episode.title || `الحلقة ${toArabicDigits(epNumber)}`}
          </h1>
          {episode.isFiller && (
            <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/25">
              فيلر
            </span>
          )}
          {(episode.views ?? 0) > 0 && (
            <span className="text-xs text-slate-500">
              {formatCount(episode.views)} مشاهدة
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {prevEp && (
            <button
              onClick={() => router.push(`/watch/${slug}/${prevEp.number}`)}
              className="flex items-center gap-1 rounded-xl border border-edge bg-card px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-primary/50 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
              الحلقة {toArabicDigits(prevEp.number)}
            </button>
          )}
          {nextEp && (
            <button
              onClick={() => router.push(`/watch/${slug}/${nextEp.number}`)}
              className="flex items-center gap-1 rounded-xl bg-gradient-to-l from-primary to-accent px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-primary/30 transition hover:brightness-110"
            >
              التالية
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* player box */}
      <div className="group/player relative aspect-video w-full overflow-hidden rounded-2xl border border-edge bg-black shadow-2xl shadow-black/60">
        {mode === "hls" && (
          <video
            ref={videoRef}
            className="h-full w-full"
            playsInline
            controls={false}
            onLoadedMetadata={onLoadedMetadata}
            onPlaying={() => {
              setPlaying(true);
              setLoading(false);
            }}
            onPause={() => {
              setPlaying(false);
              const v = videoRef.current;
              if (v && v.currentTime > 0)
                persistProgress(v.currentTime, v.duration || 0);
            }}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.currentTime > 0)
                persistProgress(v.currentTime, v.duration || 0);
            }}
            onEnded={() => {
              saveProgress({
                slug,
                ep: epNumber,
                time: 0,
                duration: videoRef.current?.duration || 0,
                animeTitle: anime.title,
                animeArabic: anime.titleArabic,
                coverImage: anime.coverImage,
              });
              if (nextEp) router.push(`/watch/${slug}/${nextEp.number}`);
            }}
            onClick={togglePlay}
          />
        )}

        {mode === "embed" && (
          <iframe
            src={source}
            className="h-full w-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="no-referrer"
            title="مشغّل الحلقة"
          />
        )}

        {mode === "none" && (
          <div className="grid h-full w-full place-items-center">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
              <p className="mt-3 text-sm font-semibold text-slate-300">
                لا توجد سيرفرات متاحة لهذه الحلقة
              </p>
            </div>
          </div>
        )}

        {/* overlays */}
        {loading && mode === "hls" && (
          <div className="absolute inset-0 grid place-items-center bg-black/70">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary-soft" />
              <p className="text-sm text-slate-300">جارٍ تجهيز البث…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 grid place-items-center bg-black/80 p-4">
            <div className="max-w-sm text-center">
              <AlertTriangle className="mx-auto h-9 w-9 text-red-400" />
              <p className="mt-3 text-sm text-slate-200">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setServerIdx((i) => (i + 1) % Math.max(servers.length, 1));
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-primary/50"
              >
                <Server className="h-4 w-4" />
                تبديل السيرفر
              </button>
            </div>
          </div>
        )}

        {/* big play / pause */}
        {mode === "hls" && !loading && !error && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 grid place-items-center"
            aria-label={playing ? "إيقاف" : "تشغيل"}
          >
            <span
              className={`grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/40 transition duration-300 ${
                playing ? "scale-75 opacity-0 group-hover/player:scale-100 group-hover/player:opacity-100" : "scale-100 opacity-90"
              }`}
            >
              {playing ? (
                <Pause className="h-7 w-7 fill-white text-white" strokeWidth={0} />
              ) : (
                <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" strokeWidth={0} />
              )}
            </span>
          </button>
        )}

        {/* bottom controls */}
        {mode === "hls" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/85 to-transparent p-3 pt-10 opacity-100 transition md:opacity-0 md:group-hover/player:opacity-100">
            <button
              onClick={togglePlay}
              className="pointer-events-auto grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              aria-label="تشغيل / إيقاف"
            >
              {playing ? (
                <Pause className="h-4 w-4 fill-white" strokeWidth={0} />
              ) : (
                <Play className="h-4 w-4 fill-white" strokeWidth={0} />
              )}
            </button>

            {levels.length > 1 && (
              <select
                value={levelIdx}
                onChange={(e) => pickLevel(Number(e.target.value))}
                className="pointer-events-auto h-9 rounded-lg border border-white/15 bg-black/60 px-2 text-xs text-slate-200 outline-none backdrop-blur"
                aria-label="الجودة"
              >
                <option value={-1}>تلقائي</option>
                {levels.map((l) => (
                  <option key={l.index} value={l.index}>
                    {l.height}p
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={goFullscreen}
              className="pointer-events-auto ms-auto grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              aria-label="ملء الشاشة"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* servers */}
      {servers.length > 1 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Server className="h-3.5 w-3.5 text-primary-soft" />
            سيرفرات المشاهدة
          </p>
          <div className="flex flex-wrap gap-2">
            {servers.map((s, i) => (
              <button
                key={s._id ?? s.name}
                onClick={() => {
                  setError(null);
                  setServerIdx(i);
                }}
                className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                  i === serverIdx
                    ? "border-transparent bg-gradient-to-l from-primary to-accent text-white shadow-lg shadow-primary/25"
                    : "border-edge bg-card text-slate-300 hover:border-primary/40 hover:text-white"
                }`}
              >
                {s.name.replace(/AnimeTom/gi, "Sanime")}
                {s.qualities && s.qualities.length > 0 && (
                  <span className="ms-2 rounded bg-black/25 px-1.5 py-0.5 text-[10px]">
                    {s.qualities.join(" · ")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* download */}
      {episode.downloadLinks && episode.downloadLinks.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Download className="h-3.5 w-3.5 text-primary-soft" />
            روابط التحميل
          </p>
          <div className="flex flex-wrap gap-2">
            {episode.downloadLinks.map((d, i) => (
              <a
                key={i}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-edge bg-card px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-primary/40 hover:text-white"
              >
                {d.name} {d.quality && `(${d.quality})`}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* rewatch hint */}
      {restored && (
        <button
          onClick={() => {
            const v = videoRef.current;
            if (v) v.currentTime = 0;
          }}
          className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-primary-soft"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          إعادة من البداية
        </button>
      )}
    </div>
  );
}

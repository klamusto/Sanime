"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Gauge,
  Layers,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Shield,
  SkipForward,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import type { EpisodeMeta } from "@/lib/types";
import type { PlayableServer } from "@/lib/servers";
import { getProgressFor, saveProgress } from "@/lib/progress";
import { formatCount, toArabicDigits } from "@/lib/format";

/** Only what the UI needs — the raw upstream blob never reaches the browser. */
export interface EpisodeInfo {
  title?: string;
  isFiller?: boolean;
  views?: number;
  downloadLinks?: { name?: string; text?: string; url: string; quality?: string }[];
}

interface PlayerProps {
  slug: string;
  epNumber: number;
  episode: EpisodeInfo;
  anime: {
    slug: string;
    title: string;
    titleArabic?: string;
    coverImage: string;
    poster?: string;
  };
  episodes: EpisodeMeta[];
  servers: PlayableServer[];
}

interface HlsLevel {
  height: number;
  index: number;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

export default function Player({
  slug,
  epNumber,
  episode,
  anime,
  episodes,
  servers,
}: PlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<InstanceType<typeof import("hls.js").default> | null>(
    null
  );

  const [serverIdx, setServerIdx] = useState(0);
  const [useAlt, setUseAlt] = useState(false);
  const [triedAlt, setTriedAlt] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  /**
   * Loading / error / levels are tracked *per source* instead of as free
   * booleans: switching server or route then resets them implicitly, and no
   * effect has to synchronously write state (which React 19 rightly dislikes).
   */
  const [readySrc, setReadySrc] = useState("");
  const [slowSrc, setSlowSrc] = useState("");
  const [errorInfo, setErrorInfo] = useState<{ src: string; msg: string } | null>(
    null
  );

  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);

  const [levelState, setLevelState] = useState<{ src: string; list: HlsLevel[] }>(
    { src: "", list: [] }
  );
  const [levelIdx, setLevelIdx] = useState(-1);
  const [autoLevelHeight, setAutoLevelHeight] = useState<number | null>(null);

  const [uiVisible, setUiVisible] = useState(true);
  const [menu, setMenu] = useState<"none" | "quality" | "speed">("none");
  const [fullscreen, setFullscreen] = useState(false);
  const [resumeAt, setResumeAt] = useState(0);
  const [nextCountdown, setNextCountdown] = useState<number | null>(null);

  const lastSave = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restored = useRef(false);

  const server = servers[serverIdx] as PlayableServer | undefined;
  const source = server ? (useAlt ? server.alt : server.src) : "";
  const isEmbed = server?.kind === "embed";
  const isVideo = !!server && !isEmbed;

  const error = errorInfo && errorInfo.src === source ? errorInfo.msg : null;
  const ready = readySrc === source && source !== "";
  const loading = !!server && !error && (!ready || waiting);
  const embedSlow = slowSrc === source && source !== "";
  const levels = levelState.src === source ? levelState.list : [];

  const nextEp = useMemo(
    () => episodes.find((e) => e.number === epNumber + 1),
    [episodes, epNumber]
  );
  const prevEp = useMemo(
    () => episodes.find((e) => e.number === epNumber - 1),
    [episodes, epNumber]
  );

  /* ----------------------------- progress ------------------------------ */
  const persistProgress = useCallback(
    (time: number, total: number) => {
      const now = Date.now();
      if (now - lastSave.current < 4000) return;
      lastSave.current = now;
      saveProgress({
        slug,
        ep: epNumber,
        time,
        duration: total,
        animeTitle: anime.title,
        animeArabic: anime.titleArabic,
        coverImage: anime.coverImage,
      });
    },
    [slug, epNumber, anime]
  );

  /* --------------------------- source loading --------------------------- */
  const teardown = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.removeAttribute("src");
      video.load();
    }
  }, []);

  /** Escalate: same server through the other route, then the next server. */
  const failover = useCallback(
    (message: string) => {
      // 1) same server, the other route (direct <-> Sanime relay)
      if (!triedAlt && server?.alt && server.alt !== source) {
        setTriedAlt(true);
        setUseAlt((v) => !v);
        return;
      }
      // 2) next server in the list
      if (serverIdx < servers.length - 1) {
        setServerIdx((i) => i + 1);
        setUseAlt(false);
        setTriedAlt(false);
        return;
      }
      // 3) out of options
      setErrorInfo({ src: source, msg: message });
    },
    [server, source, triedAlt, serverIdx, servers.length]
  );

  // Third-party embeds never tell us when they fail — if nothing loads within
  // a few seconds we surface the "use the relay / open externally" helpers.
  useEffect(() => {
    if (!isEmbed || !source) return;
    const t = setTimeout(() => setSlowSrc(source), 7000);
    return () => clearTimeout(t);
  }, [isEmbed, source]);

  useEffect(() => {
    if (!server || isEmbed) return;
    restored.current = false;
    teardown();

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let hls: InstanceType<typeof import("hls.js").default> | null = null;

    async function setup(vid: HTMLVideoElement, src: string) {
      if (server?.kind === "file") {
        vid.src = src;
        return;
      }
      const nativeHls = vid.canPlayType("application/vnd.apple.mpegurl");
      if (nativeHls) {
        vid.src = src;
        return;
      }
      try {
        const Hls = (await import("hls.js")).default;
        if (cancelled) return;
        if (!Hls.isSupported()) {
          vid.src = src;
          return;
        }
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferLength: 60,
          maxMaxBufferLength: 180,
          capLevelToPlayerSize: true,
          fragLoadingMaxRetry: 4,
          manifestLoadingMaxRetry: 3,
          levelLoadingMaxRetry: 4,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(vid);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (cancelled) return;
          setLevelState({
            src,
            list: (hls?.levels ?? []).map((l, i) => ({
              height: l.height,
              index: i,
            })),
          });
          setReadySrc(src);
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
          if (cancelled) return;
          const height = hls?.levels?.[data.level]?.height ?? null;
          setAutoLevelHeight(height);
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (cancelled || !data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            // A manifest/level 4xx means this route is blocked for us.
            failover("تعذّر الوصول إلى هذا السيرفر، جرّب سيرفراً آخر.");
            return;
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls?.recoverMediaError();
            return;
          }
          failover("تعذّر تشغيل هذه الحلقة من السيرفر الحالي.");
        });
      } catch {
        if (!cancelled) failover("تعذّر تهيئة المشغّل، جرّب سيرفراً آخر.");
      }
    }

    void setup(video, source);

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server, source, isEmbed, teardown]);

  /* ------------------------------ controls ------------------------------ */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, []);

  const seekBy = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(
      Math.max(0, video.currentTime + delta),
      video.duration
    );
  }, []);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrent(time);
  }, []);

  const changeVolume = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;
    const v = Math.min(1, Math.max(0, value));
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen().catch(() => undefined);
  }, []);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      /* unsupported */
    }
  }, []);

  const pickLevel = useCallback((idx: number) => {
    setLevelIdx(idx);
    if (hlsRef.current) hlsRef.current.currentLevel = idx;
    setMenu("none");
  }, []);

  const pickRate = useCallback((value: number) => {
    const video = videoRef.current;
    setRate(value);
    if (video) video.playbackRate = value;
    setMenu("none");
  }, []);

  /* --------------------------- ui auto hiding --------------------------- */
  const revealUi = useCallback(() => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setUiVisible(false);
    }, 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  /* --------------------------- keyboard shortcuts ----------------------- */
  useEffect(() => {
    if (!isVideo) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          e.preventDefault();
          seekBy(10);
          break;
        case "arrowleft":
          e.preventDefault();
          seekBy(-10);
          break;
        case "j":
          seekBy(-10);
          break;
        case "l":
          seekBy(10);
          break;
        case "arrowup":
          e.preventDefault();
          changeVolume((videoRef.current?.volume ?? 1) + 0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          changeVolume((videoRef.current?.volume ?? 1) - 0.1);
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "n":
          if (nextEp) router.push(`/watch/${slug}/${nextEp.number}`);
          break;
        default:
          if (/^[0-9]$/.test(e.key)) {
            const video = videoRef.current;
            if (video && Number.isFinite(video.duration)) {
              video.currentTime = (Number(e.key) / 10) * video.duration;
            }
          }
          return;
      }
      revealUi();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    isVideo,
    togglePlay,
    seekBy,
    changeVolume,
    toggleMute,
    toggleFullscreen,
    revealUi,
    nextEp,
    router,
    slug,
  ]);

  /* --------------------------- next-episode timer ----------------------- */
  useEffect(() => {
    if (nextCountdown === null) return;
    if (nextCountdown <= 0) {
      if (nextEp) router.push(`/watch/${slug}/${nextEp.number}`);
      return;
    }
    const t = setTimeout(() => setNextCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [nextCountdown, nextEp, router, slug]);

  /* ------------------------------- render ------------------------------- */
  const progressPct = duration > 0 ? (current / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const activeQuality =
    levelIdx >= 0
      ? `${levels.find((l) => l.index === levelIdx)?.height ?? ""}p`
      : autoLevelHeight
        ? `تلقائي · ${autoLevelHeight}p`
        : "تلقائي";

  return (
    <div>
      {/* ---------------------------- title row --------------------------- */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="truncate text-lg font-bold text-white sm:text-xl">
            {episode.title || `الحلقة ${toArabicDigits(epNumber)}`}
          </h1>
          {episode.isFiller && <span className="chip">فيلر</span>}
          {(episode.views ?? 0) > 0 && (
            <span className="hidden text-xs text-white/40 sm:inline">
              {formatCount(episode.views)} مشاهدة
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {prevEp && (
            <button
              onClick={() => router.push(`/watch/${slug}/${prevEp.number}`)}
              className="btn btn-sm"
            >
              <ChevronRight className="h-4 w-4" />
              السابقة
            </button>
          )}
          {nextEp && (
            <button
              onClick={() => router.push(`/watch/${slug}/${nextEp.number}`)}
              className="btn btn-sm btn-solid btn-sheen"
            >
              التالية
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------ stage ----------------------------- */}
      <div
        ref={shellRef}
        onMouseMove={revealUi}
        onMouseLeave={() => playing && setUiVisible(false)}
        className="group/player relative aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_30px_80px_-40px_rgba(0,0,0,1)]"
      >
        {isVideo && (
          <video
            ref={videoRef}
            className="h-full w-full bg-black"
            poster={anime.poster || anime.coverImage || undefined}
            playsInline
            controls={false}
            preload="metadata"
            onClick={() => {
              togglePlay();
              revealUi();
            }}
            onDoubleClick={toggleFullscreen}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              setDuration(video.duration || 0);
              setReadySrc(source);
              if (restored.current) return;
              restored.current = true;
              const saved = getProgressFor(slug);
              if (
                saved &&
                saved.ep === epNumber &&
                saved.time > 30 &&
                video.duration > 0 &&
                saved.time < video.duration - 20
              ) {
                video.currentTime = saved.time;
                setResumeAt(saved.time);
                setTimeout(() => setResumeAt(0), 7000);
              }
            }}
            onPlay={() => {
              setPlaying(true);
              revealUi();
            }}
            onPlaying={() => {
              setPlaying(true);
              setWaiting(false);
              setReadySrc(source);
            }}
            onWaiting={() => setWaiting(true)}
            onCanPlay={() => {
              setWaiting(false);
              setReadySrc(source);
            }}
            onPause={() => {
              setPlaying(false);
              setUiVisible(true);
              const v = videoRef.current;
              if (v && v.currentTime > 0)
                persistProgress(v.currentTime, v.duration || 0);
            }}
            onVolumeChange={(e) => {
              setVolume(e.currentTarget.volume);
              setMuted(e.currentTarget.muted);
            }}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              setCurrent(v.currentTime);
              if (v.buffered.length > 0) {
                setBuffered(v.buffered.end(v.buffered.length - 1));
              }
              if (v.currentTime > 0) persistProgress(v.currentTime, v.duration || 0);
            }}
            onError={() => {
              // Ignore the synthetic error fired while we swap sources, and
              // let hls.js own its errors when it is driving the element.
              const v = videoRef.current;
              if (!v || !v.currentSrc || hlsRef.current) return;
              failover("تعذّر تشغيل المصدر الحالي.");
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
              setPlaying(false);
              if (nextEp) setNextCountdown(8);
            }}
          />
        )}

        {isEmbed && (
          <iframe
            key={source}
            src={source}
            className="h-full w-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="origin"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox"
            onLoad={() => setReadySrc(source)}
            title="مشغّل الحلقة"
          />
        )}

        {!server && (
          <div className="grid h-full w-full place-items-center px-6 text-center">
            <div>
              <AlertTriangle className="mx-auto h-10 w-10 text-white/70" />
              <p className="mt-3 text-sm font-semibold text-white/80">
                لا توجد سيرفرات صالحة لهذه الحلقة
              </p>
              <p className="mt-1 text-xs text-white/45">
                غالباً لم يرفع المصدر روابط المشاهدة بعد — جرّب لاحقاً أو شاهد
                حلقة أخرى.
              </p>
            </div>
          </div>
        )}

        {/* loading veil */}
        {loading && !error && server && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-9 w-9 animate-spin text-white" />
              <p className="text-xs font-medium text-white/70">
                {isEmbed ? "جارٍ فتح السيرفر…" : "جارٍ تجهيز البث…"}
              </p>
            </div>
          </div>
        )}

        {/* resume toast */}
        {resumeAt > 0 && (
          <div className="absolute bottom-24 start-4 z-20 animate-scale-in">
            <div className="glass-strong flex items-center gap-3 rounded-2xl px-3.5 py-2.5">
              <span className="text-xs text-white/80">
                استُؤنفت من{" "}
                <span dir="ltr" className="font-semibold text-white">
                  {formatTime(resumeAt)}
                </span>
              </span>
              <button
                onClick={() => {
                  seekTo(0);
                  setResumeAt(0);
                }}
                className="btn btn-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                من البداية
              </button>
            </div>
          </div>
        )}

        {/* error */}
        {error && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/85 p-6 backdrop-blur-sm">
            <div className="max-w-sm text-center">
              <AlertTriangle className="mx-auto h-9 w-9 text-white/80" />
              <p className="mt-3 text-sm text-white/90">{error}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setErrorInfo(null);
                    setTriedAlt(false);
                    setUseAlt(false);
                    setServerIdx((i) => (i + 1) % Math.max(servers.length, 1));
                  }}
                  className="btn btn-sm btn-solid"
                >
                  <Zap className="h-3.5 w-3.5" />
                  السيرفر التالي
                </button>
                {server && (
                  <a
                    href={server.direct}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    فتح خارجياً
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* next-episode overlay */}
        {nextCountdown !== null && nextEp && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-black/80 backdrop-blur-sm">
            <div className="glass-strong w-[min(24rem,90%)] rounded-3xl p-6 text-center animate-scale-in">
              <p className="text-xs text-white/60">الحلقة التالية</p>
              <p className="mt-1 text-lg font-bold text-white">
                {nextEp.title || `الحلقة ${toArabicDigits(nextEp.number)}`}
              </p>
              <p className="mt-2 text-sm text-white/70">
                تبدأ خلال {toArabicDigits(nextCountdown)} ثوانٍ
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  onClick={() => router.push(`/watch/${slug}/${nextEp.number}`)}
                  className="btn btn-sm btn-solid"
                >
                  <SkipForward className="h-4 w-4" />
                  تشغيل الآن
                </button>
                <button
                  onClick={() => setNextCountdown(null)}
                  className="btn btn-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* center play button */}
        {isVideo && !loading && !error && nextCountdown === null && (
          <button
            onClick={togglePlay}
            className={`absolute inset-0 z-10 grid place-items-center transition ${
              playing ? "pointer-events-none" : ""
            }`}
            aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
          >
            <span
              className={`glass grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full transition duration-300 ${
                playing
                  ? "scale-90 opacity-0"
                  : "scale-100 opacity-100 hover:scale-105"
              }`}
            >
              <Play
                className="h-8 w-8 translate-x-0.5 fill-white text-white"
                strokeWidth={0}
              />
            </span>
          </button>
        )}

        {/* control bar */}
        {isVideo && (
          <div
            className={`absolute inset-x-0 bottom-0 z-20 transition duration-300 ${
              uiVisible || !playing
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0"
            }`}
          >
            <div className="bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-3 pt-14 sm:px-4 sm:pb-4">
              {/* seek bar */}
              <div dir="ltr" className="group/seek relative mb-2 h-4">
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="absolute inset-y-0 left-0 bg-white/30"
                    style={{ width: `${bufferedPct}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 bg-white"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={current}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="range-track absolute inset-0 h-4 w-full opacity-0 transition group-hover/seek:opacity-100"
                  aria-label="شريط التقدّم"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={togglePlay}
                  className="btn btn-icon-sm"
                  aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
                >
                  {playing ? (
                    <Pause className="h-4 w-4 fill-white" strokeWidth={0} />
                  ) : (
                    <Play className="h-4 w-4 fill-white" strokeWidth={0} />
                  )}
                </button>

                <button
                  onClick={() => seekBy(-10)}
                  className="btn btn-icon-sm hidden sm:inline-flex"
                  aria-label="رجوع ١٠ ثوانٍ"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => seekBy(10)}
                  className="btn btn-icon-sm hidden sm:inline-flex"
                  aria-label="تقدّم ١٠ ثوانٍ"
                >
                  <RotateCw className="h-4 w-4" />
                </button>

                {/* volume */}
                <div className="group/vol flex items-center">
                  <button
                    onClick={toggleMute}
                    className="btn btn-icon-sm"
                    aria-label={muted ? "إلغاء الكتم" : "كتم"}
                  >
                    {muted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                  <div
                    dir="ltr"
                    className="w-0 overflow-hidden transition-all duration-300 group-hover/vol:w-20 group-hover/vol:ps-2"
                  >
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={muted ? 0 : volume}
                      onChange={(e) => changeVolume(Number(e.target.value))}
                      className="range-track h-1 w-20 rounded-full"
                      style={{
                        background: `linear-gradient(to right, #fff ${
                          (muted ? 0 : volume) * 100
                        }%, rgba(255,255,255,.25) ${(muted ? 0 : volume) * 100}%)`,
                      }}
                      aria-label="مستوى الصوت"
                    />
                  </div>
                </div>

                <span
                  dir="ltr"
                  className="ms-1 select-none font-mono text-[11px] tabular-nums text-white/80"
                >
                  {formatTime(current)} / {formatTime(duration)}
                </span>

                <div className="ms-auto flex items-center gap-1.5">
                  {/* settings */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setMenu((m) => (m === "none" ? "quality" : "none"))
                      }
                      className="btn btn-icon-sm"
                      aria-label="الإعدادات"
                    >
                      <Settings className="h-4 w-4" />
                    </button>

                    {menu !== "none" && (
                      <div className="glass-strong absolute bottom-11 end-0 w-52 overflow-hidden rounded-2xl p-1.5 animate-scale-in">
                        <div className="mb-1 flex gap-1 rounded-xl bg-white/5 p-1">
                          <button
                            onClick={() => setMenu("quality")}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                              menu === "quality"
                                ? "bg-white text-black"
                                : "text-white/70 hover:text-white"
                            }`}
                          >
                            <Layers className="h-3.5 w-3.5" />
                            الجودة
                          </button>
                          <button
                            onClick={() => setMenu("speed")}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                              menu === "speed"
                                ? "bg-white text-black"
                                : "text-white/70 hover:text-white"
                            }`}
                          >
                            <Gauge className="h-3.5 w-3.5" />
                            السرعة
                          </button>
                        </div>

                        <div className="max-h-56 overflow-y-auto">
                          {menu === "quality" &&
                            (levels.length > 0 ? (
                              <>
                                <MenuRow
                                  active={levelIdx === -1}
                                  onClick={() => pickLevel(-1)}
                                  label={`تلقائي${
                                    autoLevelHeight
                                      ? ` (${autoLevelHeight}p)`
                                      : ""
                                  }`}
                                />
                                {[...levels]
                                  .sort((a, b) => b.height - a.height)
                                  .map((l) => (
                                    <MenuRow
                                      key={l.index}
                                      active={levelIdx === l.index}
                                      onClick={() => pickLevel(l.index)}
                                      label={`${l.height}p`}
                                    />
                                  ))}
                              </>
                            ) : (
                              <p className="px-3 py-3 text-center text-[11px] text-white/45">
                                الجودة يحددها السيرفر
                              </p>
                            ))}

                          {menu === "speed" &&
                            SPEEDS.map((s) => (
                              <MenuRow
                                key={s}
                                active={rate === s}
                                onClick={() => pickRate(s)}
                                label={s === 1 ? "عادية" : `${s}×`}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={togglePip}
                    className="btn btn-icon-sm hidden sm:inline-flex"
                    aria-label="نافذة عائمة"
                  >
                    <PictureInPicture2 className="h-4 w-4" />
                  </button>

                  {nextEp && (
                    <button
                      onClick={() => router.push(`/watch/${slug}/${nextEp.number}`)}
                      className="btn btn-icon-sm"
                      aria-label="الحلقة التالية"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={toggleFullscreen}
                    className="btn btn-icon-sm"
                    aria-label="ملء الشاشة"
                  >
                    {fullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* quality / route hint */}
              <div className="mt-1.5 hidden items-center gap-2 text-[10px] text-white/35 sm:flex">
                <span>{activeQuality}</span>
                {server?.proxied && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    يُشغَّل عبر وسيط سانيمي
                  </span>
                )}
                <span className="ms-auto">
                  مسافة: تشغيل · ← → تقديم · F ملء الشاشة · N التالية
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* embed helper bar */}
      {isEmbed && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
          <p className="text-xs text-white/60">
            {embedSlow
              ? "يبدو أن هذا السيرفر يرفض التشغيل داخل الموقع."
              : "مشغّل خارجي — إن لم يظهر الفيديو جرّب الوضع البديل."}
          </p>
          <div className="ms-auto flex flex-wrap gap-2">
            <button
              onClick={() => setUseAlt((v) => !v)}
              className="btn btn-sm"
            >
              <Shield className="h-3.5 w-3.5" />
              {useAlt ? "الوضع المباشر" : "الوضع البديل"}
            </button>
            {server && (
              <a
                href={server.direct}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                فتح في تبويب
              </a>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------- servers ---------------------------- */}
      {servers.length > 0 && (
        <div className="mt-5">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-white/60">
              <Zap className="h-3.5 w-3.5" />
              سيرفرات المشاهدة
              <span className="text-white/30">
                ({toArabicDigits(servers.length)})
              </span>
            </p>
            {servers.some((s) => s.status === "dead") && (
              <span className="text-[10px] text-white/30">
                السيرفرات المعطّلة مُعلَّمة تلقائياً
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {servers.map((s, i) => {
              const active = i === serverIdx;
              const dead = s.status === "dead";
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setErrorInfo(null);
                    setUseAlt(false);
                    setTriedAlt(false);
                    setServerIdx(i);
                  }}
                  title={s.note || s.host}
                  className={`btn btn-sm ${active ? "btn-solid" : ""} ${
                    dead && !active ? "opacity-45" : ""
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      dead
                        ? "bg-white/30"
                        : active
                          ? "bg-black/70"
                          : "bg-white/70"
                    }`}
                  />
                  {s.label}
                  {s.quality && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                        active ? "bg-black/10 text-black/70" : "bg-white/10"
                      }`}
                    >
                      {s.quality}
                    </span>
                  )}
                  {s.kind === "hls" && (
                    <span
                      className={`text-[9px] font-bold ${
                        active ? "text-black/50" : "text-white/40"
                      }`}
                    >
                      HLS
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {server?.note && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
              <Shield className="h-3 w-3" />
              {server.note}
            </p>
          )}
        </div>
      )}

      {/* ---------------------------- downloads --------------------------- */}
      {episode.downloadLinks && episode.downloadLinks.length > 0 && (
        <div className="mt-5">
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-white/60">
            <Download className="h-3.5 w-3.5" />
            روابط التحميل
          </p>
          <div className="flex flex-wrap gap-2">
            {episode.downloadLinks.map((d, i) => (
              <a
                key={i}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
              >
                <Download className="h-3.5 w-3.5" />
                {d.name || d.text || "تحميل"}
                {d.quality && (
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px]">
                    {d.quality}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuRow({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
        active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
      }`}
    >
      {label}
      {active && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}

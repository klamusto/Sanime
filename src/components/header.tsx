"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Clapperboard, Flame, Menu, Play, Search, Tv, X } from "lucide-react";
import { displayTitle, optimizeImage, toArabicDigits } from "@/lib/format";

interface Suggestion {
  _id: string;
  slug: string;
  title: string;
  titleEnglish?: string;
  titleArabic?: string;
  coverImage?: string;
  year?: number | null;
  type?: string;
}

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/anime", label: "الأنمي" },
  { href: "/movies", label: "الأفلام" },
  { href: "/latest", label: "آخر الحلقات" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOpen(false);
    setShowSuggestions(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function onType(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    if (!value.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/proxy/anime/search/suggestions?q=${encodeURIComponent(
            value.trim()
          )}&limit=8`
        );
        const json = await res.json();
        setSuggestions(json?.data ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const v = q.trim();
    if (!v) return;
    setShowSuggestions(false);
    (document.activeElement as HTMLElement | null)?.blur();
    router.push(`/search?q=${encodeURIComponent(v)}`);
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-edge/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Sanime">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
            <Play className="h-4.5 w-4.5 fill-white text-white" strokeWidth={0} />
            <span className="absolute inset-0 rounded-xl ring-1 ring-white/25" />
          </span>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-gradient">Sanime</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ms-6 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-primary/15 text-primary-soft"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <div ref={boxRef} className="relative ms-auto w-full max-w-xs sm:max-w-sm">
          <form onSubmit={submit}>
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                onType(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="ابحث عن أنمي..."
              className="h-10 w-full rounded-xl border border-edge bg-card/70 ps-10 pe-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-primary/60 focus:bg-card focus:ring-2 focus:ring-primary/25"
            />
          </form>

          {showSuggestions && (q.trim() || loading) && (
            <div className="absolute top-12 z-50 w-full overflow-hidden rounded-xl border border-edge bg-surface shadow-2xl shadow-black/60 animate-fade-in">
              {loading && suggestions.length === 0 ? (
                <div className="space-y-2 p-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="skeleton h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : suggestions.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-400">
                  لا توجد نتائج مطابقة
                </p>
              ) : (
                <ul className="max-h-80 overflow-y-auto">
                  {suggestions.map((s) => (
                    <li key={s._id}>
                      <Link
                        href={`/anime/${s.slug}`}
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center gap-3 border-b border-edge-soft px-3 py-2 transition last:border-0 hover:bg-card-hover"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={optimizeImage(s.coverImage, 120)}
                          alt=""
                          className="h-12 w-9 shrink-0 rounded-md object-cover"
                          loading="lazy"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-100">
                            {displayTitle(s)}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {s.year ? toArabicDigits(s.year) : ""}
                            {s.type ? ` · ${s.type}` : ""}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => submit()}
                      className="w-full bg-primary/10 px-3 py-2.5 text-center text-sm font-medium text-primary-soft transition hover:bg-primary/20"
                    >
                      عرض كل نتائج البحث
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-edge text-slate-300 transition hover:text-white lg:hidden"
          aria-label="القائمة"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="border-t border-edge-soft bg-surface px-4 py-3 lg:hidden animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl border border-edge px-4 py-3 text-sm font-medium transition ${
                  item.href === "/" && pathname === "/"
                    ? "border-primary/50 bg-primary/10 text-primary-soft"
                    : pathname.startsWith(item.href) && item.href !== "/"
                      ? "border-primary/50 bg-primary/10 text-primary-soft"
                      : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {item.href === "/" && <Flame className="h-4 w-4" />}
                {item.href === "/anime" && <Tv className="h-4 w-4" />}
                {item.href === "/movies" && <Clapperboard className="h-4 w-4" />}
                {item.href === "/latest" && <Play className="h-4 w-4" />}
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

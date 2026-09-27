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
  { href: "/", label: "الرئيسية", icon: Flame },
  { href: "/anime", label: "الأنمي", icon: Tv },
  { href: "/movies", label: "الأفلام", icon: Clapperboard },
  { href: "/latest", label: "آخر الحلقات", icon: Play },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setShowSuggestions(false);
    }
    document.addEventListener("mousedown", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    onScroll();
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
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
    }, 280);
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
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-black/70 backdrop-blur-2xl backdrop-saturate-150"
          : "border-b border-transparent bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="Sanime"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-2xl bg-white transition group-hover:scale-105">
            <Play className="h-4 w-4 translate-x-px fill-black text-black" strokeWidth={0} />
          </span>
          <span className="text-xl font-bold tracking-tight text-white">
            Sanime
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ms-5 hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-xl lg:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowSuggestions(false)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-white text-black shadow-sm"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
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
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => {
                onType(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="ابحث عن أنمي…"
              className="h-10 w-full rounded-full border border-white/12 bg-white/[0.06] ps-10 pe-12 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-xl transition focus:border-white/30 focus:bg-white/10"
            />
            <kbd className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/12 px-1.5 py-0.5 text-[10px] text-white/35 sm:block">
              /
            </kbd>
          </form>

          {showSuggestions && (q.trim() || loading) && (
            <div className="glass-strong absolute top-12 z-50 w-full overflow-hidden rounded-2xl animate-scale-in">
              {loading && suggestions.length === 0 ? (
                <div className="space-y-2 p-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="skeleton h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : suggestions.length === 0 ? (
                <p className="p-4 text-center text-sm text-white/45">
                  لا توجد نتائج مطابقة
                </p>
              ) : (
                <ul className="max-h-80 overflow-y-auto">
                  {suggestions.map((s) => (
                    <li key={s._id}>
                      <Link
                        href={`/anime/${s.slug}`}
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center gap-3 border-b border-white/5 px-3 py-2 transition last:border-0 hover:bg-white/8"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={optimizeImage(s.coverImage, 120)}
                          alt=""
                          className="h-12 w-9 shrink-0 rounded-lg object-cover"
                          loading="lazy"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-white">
                            {displayTitle(s)}
                          </span>
                          <span className="block truncate text-xs text-white/40">
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
                      className="w-full bg-white/8 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      عرض كل النتائج
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
          className="btn btn-icon lg:hidden"
          aria-label="القائمة"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="border-t border-white/8 bg-black/80 px-4 py-3 backdrop-blur-2xl lg:hidden animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/5 text-white/75"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}

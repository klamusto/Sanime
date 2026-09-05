"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Filter, X } from "lucide-react";

const TYPES = [
  { value: "", label: "كل الأنواع" },
  { value: "TV", label: "مسلسل" },
  { value: "Movie", label: "فيلم" },
  { value: "OVA", label: "أوفا" },
  { value: "ONA", label: "أونا" },
  { value: "Special", label: "خاص" },
];

const STATUSES = [
  { value: "", label: "كل الحالات" },
  { value: "ongoing", label: "يعرض الآن" },
  { value: "completed", label: "مكتمل" },
];

const SORTS = [
  { value: "", label: "الأحدث" },
  { value: "views", label: "الأكثر مشاهدة" },
  { value: "rating", label: "الأعلى تقييماً" },
  { value: "year", label: "الأحدث سنةً" },
];

const GENRES = [
  "أكشن",
  "مغامرات",
  "مغامرة",
  "كوميدي",
  "دراما",
  "رومانسي",
  "خيال",
  "خيال علمي",
  "فنتازيا",
  "غموض",
  "رعب",
  "نفسي",
  "شونين",
  "سينين",
  "سحري",
  "سحر",
  "مدرسي",
  "رياضة",
  "تاريخي",
  "ساموراي",
  "شريحة من الحياة",
  "قوة خارقة",
  "فنون قتالية",
  "موسيقى",
  "ميكا",
  "إيسيكاي",
  "خارق للطبيعة",
  "ألعاب فيديو",
  "مصاصي دماء",
  "سفر عبر الزمن",
];

function yearOptions() {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= 1970; y--) years.push(y);
  return years;
}

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const genres = (searchParams.get("genres") ?? "").split(",").filter(Boolean);
  const activeCount =
    genres.length +
    [searchParams.get("type"), searchParams.get("status"), searchParams.get("year")].filter(
      Boolean
    ).length;

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function toggleGenre(g: string) {
    const set = new Set(genres);
    if (set.has(g)) set.delete(g);
    else set.add(g);
    const params = new URLSearchParams(searchParams.toString());
    if (set.size > 0) params.set("genres", Array.from(set).join(","));
    else params.delete("genres");
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function clearAll() {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const selectClass =
    "h-10 rounded-xl border border-edge bg-card px-3 text-sm text-slate-200 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/25";

  return (
    <div
      className={`space-y-4 rounded-2xl border border-edge bg-surface/70 p-4 transition-opacity ${
        pending ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <Filter className="h-4 w-4 text-primary-soft" />
          تصفية النتائج
        </span>

        <select
          value={searchParams.get("type") ?? ""}
          onChange={(e) => update("type", e.target.value)}
          className={selectClass}
          aria-label="النوع"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("status") ?? ""}
          onChange={(e) => update("status", e.target.value)}
          className={selectClass}
          aria-label="الحالة"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("year") ?? ""}
          onChange={(e) => update("year", e.target.value)}
          className={selectClass}
          aria-label="السنة"
        >
          <option value="">كل السنوات</option>
          {yearOptions().map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("sort") ?? ""}
          onChange={(e) => update("sort", e.target.value)}
          className={selectClass}
          aria-label="الترتيب"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-400/10 px-3 text-xs font-medium text-red-300 transition hover:bg-red-400/20"
          >
            <X className="h-3.5 w-3.5" />
            مسح ({activeCount})
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {GENRES.map((g) => {
          const active = genres.includes(g);
          return (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-transparent bg-gradient-to-l from-primary to-accent text-white shadow-md shadow-primary/30"
                  : "border-edge bg-card text-slate-300 hover:border-primary/40 hover:text-white"
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>
    </div>
  );
}

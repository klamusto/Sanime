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
    "h-10 cursor-pointer appearance-none rounded-full border border-white/12 bg-white/[0.06] px-4 text-sm text-white/85 outline-none backdrop-blur-xl transition hover:bg-white/10 focus:border-white/35 [&>option]:bg-[#0c0c0f] [&>option]:text-white";

  return (
    <div
      className={`glass-panel space-y-4 p-4 transition-opacity ${
        pending ? "opacity-50" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-white/55">
          <Filter className="h-4 w-4" />
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
            className="btn btn-sm h-10"
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
              className={`chip ${active ? "chip-active" : "hover:bg-white/14"}`}
            >
              {g}
            </button>
          );
        })}
      </div>
    </div>
  );
}

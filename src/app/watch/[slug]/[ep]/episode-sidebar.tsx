"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ListVideo, Search } from "lucide-react";
import type { EpisodeMeta } from "@/lib/types";
import { toArabicDigits } from "@/lib/format";

export default function EpisodeSidebar({
  slug,
  episodes,
  current,
}: {
  slug: string;
  episodes: EpisodeMeta[];
  current: number;
}) {
  const [filter, setFilter] = useState("");
  const activeRef = useRef<HTMLAnchorElement>(null);

  const filtered = useMemo(() => {
    const q = filter.trim();
    if (!q) return episodes;
    return episodes.filter((e) => String(e.number).includes(q));
  }, [episodes, filter]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
  }, [current, filter]);

  return (
    <div className="flex max-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-2xl border border-edge bg-surface/70 lg:sticky lg:top-20">
      <div className="flex items-center justify-between gap-2 border-b border-edge-soft p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary-soft">
            <ListVideo className="h-4 w-4" />
          </span>
          قائمة الحلقات
          <span className="text-xs font-normal text-slate-500">
            ({toArabicDigits(episodes.length)})
          </span>
        </h2>
      </div>

      {episodes.length > 40 && (
        <div className="border-b border-edge-soft p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="رقم الحلقة…"
              className="h-9 w-full rounded-lg border border-edge bg-card ps-9 pe-3 text-sm text-slate-200 outline-none transition focus:border-primary/50"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((e) => {
            const active = e.number === current;
            return (
              <Link
                key={e._id}
                ref={active ? activeRef : undefined}
                href={`/watch/${slug}/${e.number}`}
                className={`relative flex h-10 items-center justify-center rounded-lg text-xs font-bold transition ${
                  active
                    ? "bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30"
                    : "border border-edge bg-card text-slate-300 hover:border-primary/50 hover:text-white"
                }`}
              >
                {toArabicDigits(e.number)}
                {e.isFiller && (
                  <span className="absolute end-1 top-1 h-1 w-1 rounded-full bg-amber-400" />
                )}
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full p-6 text-center text-xs text-slate-500">
              لا توجد حلقة بهذا الرقم
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

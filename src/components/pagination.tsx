"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toArabicDigits } from "@/lib/format";

export default function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function go(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`, { scroll: true });
  }

  // window of pages around current
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => go(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge text-slate-300 transition hover:border-primary/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="الصفحة السابقة"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => go(1)}
            className="h-10 w-10 rounded-xl border border-edge text-sm text-slate-300 transition hover:border-primary/50 hover:text-white"
          >
            {toArabicDigits(1)}
          </button>
          {start > 2 && <span className="px-1 text-slate-600">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => go(p)}
          className={`h-10 w-10 rounded-xl border text-sm font-semibold transition ${
            p === currentPage
              ? "border-transparent bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30"
              : "border-edge text-slate-300 hover:border-primary/50 hover:text-white"
          }`}
        >
          {toArabicDigits(p)}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-slate-600">…</span>}
          <button
            onClick={() => go(totalPages)}
            className="h-10 w-10 rounded-xl border border-edge text-sm text-slate-300 transition hover:border-primary/50 hover:text-white"
          >
            {toArabicDigits(totalPages)}
          </button>
        </>
      )}

      <button
        onClick={() => go(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge text-slate-300 transition hover:border-primary/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="الصفحة التالية"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </nav>
  );
}

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

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => go(currentPage - 1)}
        disabled={currentPage <= 1}
        className="btn btn-icon"
        aria-label="الصفحة السابقة"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {start > 1 && (
        <>
          <button onClick={() => go(1)} className="btn btn-icon">
            {toArabicDigits(1)}
          </button>
          {start > 2 && <span className="px-1 text-white/25">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => go(p)}
          className={`btn btn-icon ${p === currentPage ? "btn-solid" : ""}`}
          aria-current={p === currentPage ? "page" : undefined}
        >
          {toArabicDigits(p)}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-white/25">…</span>}
          <button onClick={() => go(totalPages)} className="btn btn-icon">
            {toArabicDigits(totalPages)}
          </button>
        </>
      )}

      <button
        onClick={() => go(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="btn btn-icon"
        aria-label="الصفحة التالية"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </nav>
  );
}

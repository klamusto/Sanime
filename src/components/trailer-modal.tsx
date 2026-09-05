"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import { youtubeId } from "@/lib/format";

export default function TrailerButton({ url }: { url?: string }) {
  const [open, setOpen] = useState(false);
  const id = youtubeId(url);
  if (!id) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-edge bg-surface/70 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-primary/50 hover:text-white"
      >
        <Play className="h-4 w-4 text-primary-soft" />
        مشاهدة الإعلان
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-edge bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute end-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-slate-300 transition hover:text-white"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
                title="إعلان الأنمي"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

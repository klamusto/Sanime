"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import { youtubeId } from "@/lib/format";

export default function TrailerButton({ url }: { url?: string }) {
  const [open, setOpen] = useState(false);
  const id = youtubeId(url);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!id) return null;

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn">
        <Play className="h-4 w-4" />
        مشاهدة الإعلان
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/85 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/12 bg-black shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="btn btn-icon-sm absolute end-3 top-3 z-10"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
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

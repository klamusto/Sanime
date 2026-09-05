"use client";

import { useEffect } from "react";
import { RefreshCcw, WifiOff } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto grid max-w-7xl place-items-center px-4 py-28 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl border border-edge bg-card text-red-400">
        <WifiOff className="h-10 w-10" />
      </span>
      <h1 className="mt-8 text-2xl font-bold text-white">حدث خطأ غير متوقع</h1>
      <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500">
        تعذّر تحميل المحتوى. قد يكون الاتصال بالمصدر متقطعاً مؤقتاً.
      </p>
      <button
        onClick={reset}
        className="mt-8 flex items-center gap-2 rounded-xl bg-gradient-to-l from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:brightness-110"
      >
        <RefreshCcw className="h-4 w-4" />
        إعادة المحاولة
      </button>
    </div>
  );
}

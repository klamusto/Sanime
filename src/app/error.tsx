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
      <span className="glass grid h-20 w-20 place-items-center rounded-[1.75rem] text-white/80">
        <WifiOff className="h-10 w-10" />
      </span>
      <h1 className="mt-8 text-2xl font-bold text-white">حدث خطأ غير متوقع</h1>
      <p className="mt-3 max-w-sm text-sm leading-7 text-white/45">
        تعذّر تحميل المحتوى. قد يكون الاتصال بالمصدر متقطعاً مؤقتاً.
      </p>
      <button
        onClick={reset}
        className="btn btn-lg btn-solid btn-sheen mt-8"
      >
        <RefreshCcw className="h-4 w-4" />
        إعادة المحاولة
      </button>
    </div>
  );
}

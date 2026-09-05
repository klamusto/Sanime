import Link from "next/link";
import { Ghost, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-7xl place-items-center px-4 py-28 text-center">
      <div className="animate-float">
        <span className="mx-auto grid h-24 w-24 place-items-center rounded-3xl border border-edge bg-card text-primary-soft shadow-2xl shadow-primary/20">
          <Ghost className="h-12 w-12" />
        </span>
      </div>
      <h1 className="mt-8 text-4xl font-bold text-white">٤٠٤</h1>
      <p className="mt-3 text-lg font-semibold text-slate-200">
        هذه الصفحة غير موجودة
      </p>
      <p className="mt-2 max-w-sm text-sm leading-7 text-slate-500">
        ربما تم حذف الأنمي أو تغيّر رابطه. عد للرئيسية وتابع الاستكشاف.
      </p>
      <Link
        href="/"
        className="mt-8 flex items-center gap-2 rounded-xl bg-gradient-to-l from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:brightness-110"
      >
        <Home className="h-4 w-4" />
        العودة للرئيسية
      </Link>
    </div>
  );
}

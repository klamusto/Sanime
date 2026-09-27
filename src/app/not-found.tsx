import Link from "next/link";
import { Ghost, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-7xl place-items-center px-4 py-28 text-center">
      <div className="animate-float">
        <span className="glass mx-auto grid h-24 w-24 place-items-center rounded-[1.75rem] text-white/80">
          <Ghost className="h-12 w-12" />
        </span>
      </div>
      <h1 className="mt-8 text-4xl font-bold text-white">٤٠٤</h1>
      <p className="mt-3 text-lg font-semibold text-white/85">
        هذه الصفحة غير موجودة
      </p>
      <p className="mt-2 max-w-sm text-sm leading-7 text-white/45">
        ربما تم حذف الأنمي أو تغيّر رابطه. عد للرئيسية وتابع الاستكشاف.
      </p>
      <Link
        href="/"
        className="btn btn-lg btn-solid btn-sheen mt-8"
      >
        <Home className="h-4 w-4" />
        العودة للرئيسية
      </Link>
    </div>
  );
}

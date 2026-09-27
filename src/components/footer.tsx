import Link from "next/link";
import { Play } from "lucide-react";

const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/anime", label: "قائمة الأنمي" },
  { href: "/movies", label: "أفلام الأنمي" },
  { href: "/latest", label: "آخر الحلقات" },
];

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/8 bg-white/[0.02]">
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white">
              <Play
                className="h-4 w-4 translate-x-px fill-black text-black"
                strokeWidth={0}
              />
            </span>
            <span className="text-xl font-bold text-white">Sanime</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/45">
            وجهتك العربية لمشاهدة الأنمي — آلاف الحلقات المترجمة والأفلام بجودة
            عالية وواجهة سريعة، محدّثة باستمرار.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white/80">روابط سريعة</h3>
          <ul className="space-y-2.5">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-white/45 transition hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white/80">حول سانيمي</h3>
          <p className="text-sm leading-7 text-white/45">
            يعرض الموقع محتوى أنمي مترجم للعربية من مصادر مفتوحة على الإنترنت.
            جميع الحقوق محفوظة لأصحابها الأصليين.
          </p>
        </div>
      </div>
      <div className="relative border-t border-white/6 py-5 text-center text-xs text-white/35">
        © {new Date().getFullYear()} Sanime — صُنع بشغف لعشاق الأنمي
      </div>
    </footer>
  );
}

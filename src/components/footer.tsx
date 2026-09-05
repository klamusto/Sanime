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
    <footer className="relative mt-20 border-t border-edge bg-surface/60">
      <div className="aurora opacity-40" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <Play className="h-4.5 w-4.5 fill-white text-white" strokeWidth={0} />
            </span>
            <span className="text-xl font-bold">
              <span className="text-gradient">Sanime</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
            وجهتك العربية لمشاهدة الأنمي — آلاف الحلقات المترجمة والأفلام
            بجودة عالية وواجهة سريعة، محدّثة باستمرار.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-200">روابط سريعة</h3>
          <ul className="space-y-2.5">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-slate-400 transition hover:text-primary-soft"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-200">حول سانيمي</h3>
          <p className="text-sm leading-7 text-slate-400">
            يعرض الموقع محتوى أنمي مترجم للعربية من مصادر مفتوحة على الإنترنت.
            جميع الحقوق محفوظة لأصحابها الأصليين.
          </p>
        </div>
      </div>
      <div className="relative border-t border-edge-soft py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Sanime — صُنع بشغف لعشاق الأنمي ✦
      </div>
    </footer>
  );
}

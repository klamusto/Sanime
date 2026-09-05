import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export default function Section({
  title,
  icon,
  href,
  children,
}: {
  title: string;
  icon?: ReactNode;
  href?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2.5 text-lg font-bold text-white sm:text-xl">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary/25 to-accent/25 text-primary-soft ring-1 ring-primary/25">
            {icon}
          </span>
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="group flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-primary/50 hover:text-primary-soft"
          >
            عرض الكل
            <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

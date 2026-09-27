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
    <section className="mt-12 first:mt-0">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2.5 text-lg font-bold text-white sm:text-xl">
          {icon && (
            <span className="glass grid h-9 w-9 place-items-center rounded-2xl text-white">
              {icon}
            </span>
          )}
          {title}
        </h2>
        {href && (
          <Link href={href} className="btn btn-sm group">
            عرض الكل
            <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

import type { Metadata } from "next";
import { Clapperboard } from "lucide-react";
import CatalogView from "@/components/catalog-view";
import { getAnimeList } from "@/lib/animetom";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "أفلام الأنمي",
  description: "شاهد أفلام الأنمي المترجمة للعربية بجودة عالية على Sanime.",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MoviesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Number.parseInt(str(sp.page) ?? "1", 10) || 1;

  // Sidebar spotlight: top rated movies
  let spotlight: Awaited<ReturnType<typeof getAnimeList>> | null = null;
  try {
    spotlight = await getAnimeList({
      page: 1,
      limit: 6,
      type: "Movie",
      sort: "rating",
    });
  } catch {
    spotlight = null;
  }

  return (
    <div>
      <CatalogView
        title="أفلام الأنمي"
        icon={<Clapperboard className="h-5 w-5" />}
        params={{
          q: str(sp.q),
          page: String(page),
          genres: str(sp.genres),
          type: str(sp.type) ?? "Movie",
          status: str(sp.status),
          year: str(sp.year),
          sort: str(sp.sort),
        }}
      />
      {spotlight && spotlight.data.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <p className="mb-4 text-sm font-semibold text-white/55">
            ★ أعلى الأفلام تقييماً على سانيمي
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {spotlight.data.map((m) => (
              <a
                key={m._id}
                href={`/anime/${m.slug}`}
                className="group flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[0.035] p-2.5 transition hover:border-white/25 hover:bg-white/[0.07]"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-bold text-white/70">
                  ★
                </span>
                <span className="line-clamp-2 text-xs font-medium text-white/65 transition group-hover:text-white">
                  {m.titleArabic || m.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

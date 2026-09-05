import { Suspense } from "react";
import { SearchX } from "lucide-react";
import Filters from "@/components/filters";
import AnimeCard from "@/components/anime-card";
import Pagination from "@/components/pagination";
import { GridSkeleton } from "@/components/skeletons";
import { getAnimeList, searchAnime } from "@/lib/animetom";
import { clamp, pageParam, toArabicDigits } from "@/lib/format";

interface Params {
  q?: string;
  page?: string;
  genres?: string;
  type?: string;
  status?: string;
  year?: string;
  sort?: string;
}

export default async function CatalogView({
  params,
  title,
  icon,
}: {
  params: Params;
  title?: string;
  icon?: React.ReactNode;
}) {
  const q = (params.q ?? "").trim();
  const page = clamp(pageParam(params.page), 1, 10_000);
  const genres = (params.genres ?? "").split(",").map((g) => g.trim()).filter(Boolean);
  const limit = 24;

  let result;
  try {
    result = q
      ? await searchAnime(q, page, limit)
      : await getAnimeList({
          page,
          limit,
          genres,
          type: params.type || undefined,
          status: params.status || undefined,
          year: params.year || undefined,
          sort: params.sort || undefined,
        });
  } catch {
    result = null;
  }

  const total = result?.pagination?.totalResults ?? result?.data?.length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-white sm:text-3xl">
            {icon && (
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/25 to-accent/25 text-primary-soft ring-1 ring-primary/25">
                {icon}
              </span>
            )}
            {title ?? "قائمة الأنمي"}
            {q && (
              <span className="text-gradient text-xl font-bold sm:text-2xl">
                «{q}»
              </span>
            )}
          </h1>
          {result && (
            <p className="mt-2 text-sm text-slate-500">
              {toArabicDigits(total)} نتيجة
              {result.pagination?.totalPages > 1 &&
                ` · ${toArabicDigits(result.pagination.totalPages)} صفحة`}
            </p>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <Filters />
      </Suspense>

      <div className="mt-6">
        {!result ? (
          <div className="grid place-items-center gap-3 rounded-3xl border border-edge bg-card py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-400/10 text-red-300">
              <SearchX className="h-7 w-7" />
            </span>
            <p className="font-semibold text-slate-200">تعذّر جلب النتائج</p>
            <p className="text-sm text-slate-500">
              حدث خطأ أثناء الاتصال بالمصدر، جرّب تحديث الصفحة بعد قليل.
            </p>
          </div>
        ) : result.data.length === 0 ? (
          <div className="grid place-items-center gap-3 rounded-3xl border border-edge bg-card py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary-soft">
              <SearchX className="h-7 w-7" />
            </span>
            <p className="font-semibold text-slate-200">لا توجد نتائج مطابقة</p>
            <p className="text-sm text-slate-500">
              جرّب تعديل الفلاتر أو البحث بكلمات أخرى.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {result.data.map((a) => (
                <AnimeCard key={a._id} anime={a} />
              ))}
            </div>
            <Pagination
              currentPage={result.pagination.currentPage}
              totalPages={Math.min(result.pagination.totalPages, 500)}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function CatalogLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="skeleton mb-6 h-9 w-56 rounded-xl" />
      <div className="skeleton mb-6 h-24 w-full rounded-2xl" />
      <GridSkeleton count={12} />
    </div>
  );
}

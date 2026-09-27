import type { Metadata } from "next";
import { Clock3 } from "lucide-react";
import LatestEpisodeCard from "@/components/latest-episode-card";
import Pagination from "@/components/pagination";
import { getLatestEpisodes } from "@/lib/animetom";
import { clamp, pageParam, toArabicDigits } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "آخر الحلقات",
  description: "أحدث حلقات الأنمي المترجمة للعربية، محدّثة لحظياً على Sanime.",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LatestPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = clamp(pageParam(sp.page), 1, 10_000);
  const limit = 30;

  let result;
  try {
    result = await getLatestEpisodes(page, limit);
  } catch {
    result = null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="glass grid h-11 w-11 place-items-center rounded-2xl text-white">
          <Clock3 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">آخر الحلقات</h1>
          {result && (
            <p className="mt-1 text-sm text-white/40">
              {toArabicDigits(result.pagination.totalResults ?? result.data.length)}{" "}
              حلقة مترجمة · تحديث مستمر
            </p>
          )}
        </div>
      </div>

      {!result ? (
        <p className="glass-panel p-10 text-center text-sm text-white/45">
          تعذّر تحميل الحلقات حالياً، حاول مجدداً بعد قليل.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((ep) => (
              <LatestEpisodeCard key={ep._id} ep={ep} />
            ))}
          </div>
          <Pagination
            currentPage={result.pagination.currentPage}
            totalPages={Math.min(result.pagination.totalPages, 500)}
          />
        </>
      )}
    </div>
  );
}

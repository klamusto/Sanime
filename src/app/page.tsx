import type { Metadata } from "next";
import {
  CalendarClock,
  Clock3,
  Flame,
  Play,
  Sparkles,
  Tv,
} from "lucide-react";
import {
  getAnimeList,
  getFeatured,
  getLatestEpisodes,
  getSeasonal,
} from "@/lib/animetom";
import Link from "next/link";
import Hero from "@/components/hero";
import Section from "@/components/section";
import AnimeCard from "@/components/anime-card";
import LatestEpisodeCard from "@/components/latest-episode-card";
import ContinueWatching from "@/components/continue-watching";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sanime — وجهتك لمشاهدة الأنمي المترجم",
  description:
    "شاهد أحدث حلقات الأنمي المترجمة للعربية بجودة عالية. آلاف الحلقات وأفلام الأنمي محدّثة يومياً.",
};

export default async function HomePage() {
  const [featured, latest, seasonal, newest] = await Promise.allSettled([
    getFeatured(10),
    getLatestEpisodes(1, 12),
    getSeasonal(14),
    getAnimeList({ limit: 12, page: 1 }),
  ]);

  const featuredItems = featured.status === "fulfilled" ? featured.value : [];
  const latestRes = latest.status === "fulfilled" ? latest.value : null;
  const seasonalItems = seasonal.status === "fulfilled" ? seasonal.value : [];
  const newestItems = newest.status === "fulfilled" ? newest.value.data : [];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
      <div className="pt-6">
        <Hero items={featuredItems} />
      </div>

      <ContinueWatching />

      <Section
        title="آخر الحلقات"
        icon={<Clock3 className="h-4 w-4" />}
        href="/latest"
      >
        {latestRes ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latestRes.data.map((ep) => (
              <LatestEpisodeCard key={ep._id} ep={ep} />
            ))}
          </div>
        ) : (
          <p className="glass-panel p-8 text-center text-sm text-white/45">
            تعذّر تحميل آخر الحلقات حالياً، حاول مرة أخرى بعد قليل.
          </p>
        )}
      </Section>

      {seasonalItems.length > 0 && (
        <Section
          title="أنميات الموسم"
          icon={<CalendarClock className="h-4 w-4" />}
          href="/anime?sort=views"
        >
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {seasonalItems.map((a) => (
              <div key={a._id} className="w-36 shrink-0 sm:w-40">
                <AnimeCard
                  anime={{
                    ...a,
                    title: a.title,
                    slug: a.slug,
                    coverImage: a.coverImage,
                    r2CoverImage: (a as { r2CoverImage?: string }).r2CoverImage,
                    year: a.year,
                    status: a.status,
                    rating: a.rating,
                    type: a.type ?? "TV",
                    genres: [],
                    episodes: a.episodes,
                    publishedEpisodes: a.publishedEpisodes ?? a.episodes,
                    description: "",
                  }}
                />
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section
        title="جديد الأنمي"
        icon={<Sparkles className="h-4 w-4" />}
        href="/anime"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {newestItems.map((a) => (
            <AnimeCard key={a._id} anime={a} />
          ))}
        </div>
      </Section>

      {/* genre quick links */}
      <Section title="تصفّح حسب التصنيف" icon={<Flame className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {GENRES.map((g, i) => (
            <Link
              key={g}
              href={`/anime?genres=${encodeURIComponent(g)}`}
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-medium text-white/70 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              {g}
              <span className="text-lg text-white/25 transition group-hover:text-white/70">
                {i % 2 === 0 ? "✦" : "✧"}
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <div className="glass-panel relative mt-16 flex flex-col items-center gap-3 overflow-hidden px-6 py-12 text-center">
        <div className="grid-veil" aria-hidden />
        <span className="glass grid h-12 w-12 place-items-center rounded-2xl">
          <Tv className="h-6 w-6 text-white" />
        </span>
        <h3 className="relative text-xl font-bold text-white">
          متابعة يومية؟ كل شيء هنا في مكان واحد
        </h3>
        <p className="relative max-w-md text-sm leading-7 text-white/50">
          تصفّح القائمة الكاملة، ابحث عن أنميك المفضل، وابدأ المشاهدة خلال ثوانٍ.
        </p>
        <Link href="/anime" className="btn btn-lg btn-solid btn-sheen relative mt-2">
          استكشف المكتبة
        </Link>
      </div>
    </div>
  );
}

const GENRES = [
  "أكشن",
  "مغامرات",
  "كوميدي",
  "دراما",
  "رومانسي",
  "خيال",
  "غموض",
  "رعب",
  "نفسي",
  "شونين",
  "سينين",
  "سحري",
  "مدرسي",
  "رياضة",
  "تاريخي",
  "ساموراي",
  "خيال علمي",
  "شريحة من الحياة",
];

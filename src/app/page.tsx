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

      <Section
        title="تابع مشاهدتك"
        icon={<Play className="h-4 w-4" />}
      >
        <ContinueWatching />
      </Section>

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
          <p className="rounded-2xl border border-edge bg-card p-8 text-center text-sm text-slate-500">
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
            <a
              key={g}
              href={`/anime?genres=${encodeURIComponent(g)}`}
              className="group flex items-center justify-between rounded-xl border border-edge bg-card px-4 py-3.5 text-sm font-medium text-slate-300 transition hover:border-primary/50 hover:text-white"
            >
              {g}
              <span className="text-lg text-primary/60 transition group-hover:text-primary">
                {i % 2 === 0 ? "✦" : "✧"}
              </span>
            </a>
          ))}
        </div>
      </Section>

      <div className="mt-14 flex flex-col items-center gap-3 rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/10 via-card to-accent/10 px-6 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
          <Tv className="h-6 w-6 text-white" />
        </span>
        <h3 className="text-xl font-bold text-white">
          متابعة يومية؟ كل شيء هنا في مكان واحد
        </h3>
        <p className="max-w-md text-sm leading-7 text-slate-400">
          تصفّح القائمة الكاملة، ابحث عن أنميك المفضل، وابدأ المشاهدة خلال ثوانٍ.
        </p>
        <a
          href="/anime"
          className="mt-2 rounded-xl bg-gradient-to-l from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:brightness-110"
        >
          استكشف المكتبة
        </a>
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

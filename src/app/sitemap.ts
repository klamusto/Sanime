import type { MetadataRoute } from "next";
import { getAnimeList } from "@/lib/animetom";
import { SITE_URL } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/anime`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/latest`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/movies`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.4 },
  ];

  try {
    const list = await getAnimeList({ page: 1, limit: 200 });
    const animeRoutes: MetadataRoute.Sitemap = list.data.map((a) => ({
      url: `${base}/anime/${a.slug}`,
      lastModified: a.updatedAt ? new Date(a.updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...staticRoutes, ...animeRoutes];
  } catch {
    return staticRoutes;
  }
}

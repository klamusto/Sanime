import type { Metadata } from "next";
import { Search } from "lucide-react";
import CatalogView from "@/components/catalog-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "البحث",
  description: "ابحث عن أنميك المفضل ضمن آلاف الأعمال المترجمة.",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = str(sp.q);
  return (
    <CatalogView
      title={q ? "نتائج البحث عن" : "البحث"}
      icon={<Search className="h-5 w-5" />}
      params={{
        q,
        page: str(sp.page),
        genres: str(sp.genres),
        type: str(sp.type),
        status: str(sp.status),
        year: str(sp.year),
        sort: str(sp.sort),
      }}
    />
  );
}

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

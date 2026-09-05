import type { Metadata } from "next";
import { Tv } from "lucide-react";
import CatalogView from "@/components/catalog-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "قائمة الأنمي",
  description: "تصفّح آلاف مسلسلات وأفلام الأنمي المترجمة للعربية على Sanime.",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AnimePage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <CatalogView
      title="قائمة الأنمي"
      icon={<Tv className="h-5 w-5" />}
      params={{
        q: str(sp.q),
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

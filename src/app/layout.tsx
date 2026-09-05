import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: {
    default: "Sanime — وجهتك لمشاهدة الأنمي المترجم",
    template: "%s | Sanime",
  },
  description:
    "شاهد أحدث حلقات الأنمي المترجمة للعربية بجودة عالية. آلاف الحلقات وأفلام الأنمي محدّثة يومياً على Sanime.",
  keywords: [
    "أنمي",
    "anime",
    "مشاهدة أنمي",
    "حلقات أنمي",
    "أنمي مترجم",
    "Sanime",
    "سانيمي",
  ],
  metadataBase: new URL("https://sanime.example.com"),
  openGraph: {
    type: "website",
    locale: "ar_SA",
    title: "Sanime — وجهتك لمشاهدة الأنمي المترجم",
    description: "آلاف الحلقات وأفلام الأنمي المترجمة للعربية بجودة عالية.",
    siteName: "Sanime",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanime — وجهتك لمشاهدة الأنمي المترجم",
    description: "آلاف الحلقات وأفلام الأنمي المترجمة للعربية بجودة عالية.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-bg text-slate-100 antialiased">
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute -top-40 start-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute top-1/3 -end-20 h-80 w-80 rounded-full bg-accent/8 blur-[110px]" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

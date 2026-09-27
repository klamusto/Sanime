import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";
import "@fontsource/ibm-plex-sans-arabic/latin-400.css";
import "@fontsource/ibm-plex-sans-arabic/latin-600.css";
import "@fontsource/ibm-plex-sans-arabic/latin-700.css";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { SITE_NAME, SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — وجهتك لمشاهدة الأنمي المترجم`,
    template: `%s | ${SITE_NAME}`,
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
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "ar_SA",
    title: `${SITE_NAME} — وجهتك لمشاهدة الأنمي المترجم`,
    description: "آلاف الحلقات وأفلام الأنمي المترجمة للعربية بجودة عالية.",
    siteName: SITE_NAME,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — وجهتك لمشاهدة الأنمي المترجم`,
    description: "آلاف الحلقات وأفلام الأنمي المترجمة للعربية بجودة عالية.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-black text-white antialiased">
        {/* soft monochrome ambience */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute -top-48 start-1/4 h-[28rem] w-[28rem] rounded-full bg-white/[0.045] blur-[140px]" />
          <div className="absolute bottom-0 -end-24 h-[22rem] w-[22rem] rounded-full bg-white/[0.03] blur-[130px]" />
          <div className="grid-veil" />
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

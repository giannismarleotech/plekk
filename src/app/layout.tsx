import type { Metadata } from "next";
import { site } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${site.domain}`),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: "Boeken, reserveren en bestellen voor lokale zaken. Geen commissie, ooit.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Plekk" },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/brand/favicon-64.svg", sizes: "64x64", type: "image/svg+xml" }], apple: "/brand/app-icon.png" },
  openGraph: { title: `${site.name} — ${site.tagline}`, description: "Boeken, reserveren en bestellen voor lokale zaken. Geen commissie, ooit.", images: ["/brand/og.png"], locale: "nl_BE", type: "website" },
};

export const viewport = { themeColor: "#1ED760" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl-BE" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700&family=Source+Sans+3:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

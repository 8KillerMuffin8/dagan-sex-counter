import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "מונה הסקס של דגן | dagan-sex-counter.com",
  description: "מעקב חי ואמין אחר פעילות הסקס של דגן 🚀",
  openGraph: {
    title: "מונה הסקס של דגן",
    description: "מעקב חי ואמין אחר פעילות הסקס של דגן 🚀",
    url: "https://dagan-sex-counter.com",
    siteName: "dagan-sex-counter.com",
    locale: "he_IL",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

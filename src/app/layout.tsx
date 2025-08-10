import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Inter, Geist, Space_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.className} ${geist.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        <Analytics />
      </body>
    </html>
  );
}

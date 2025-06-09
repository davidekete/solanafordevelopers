import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Inter, Geist } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist"
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} ${geist.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://solanafordevs.com";
  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/docs`, lastModified: new Date() },
    // add more routes...
  ];
}

const RAW_INTERNAL_HOSTS = [
  "solanafordevs.com",
  "www.solanafordevs.com",
  "solanafordevelopers.com",
  "www.solanafordevelopers.com",
  "localhost:3000",
  "127.0.0.1:3000",
];

export const INTERNAL_HOSTS = new Set(RAW_INTERNAL_HOSTS);

// If your docs live under a prefix (e.g. /docs)
export const DOCS_PREFIX = "/docs/";

/** Normalize host for comparison */
function normalizeHost(h: string | null) {
  return (h || "").toLowerCase().replace(/\.$/, "");
}

/** Strip locale and basePath if you use them (optional) */
export function normalizePathname(pathname: string) {
  // if using i18n like /en/docs/...: remove leading locale segment
  const parts = pathname.split("/").filter(Boolean);
  const maybeLocale = parts[0];
  const locales = ["en", "fr", "de", "es"]; // keep in sync with next.config
  if (locales.includes(maybeLocale)) parts.shift();
  return "/" + parts.join("/");
}

/** Is a URL internal to your site(s)? */
export function isInternalUrl(href: string) {
  try {
    const u = new URL(href, "http://localhost:3000"); // base lets this handle relative URLs
    const host = normalizeHost(u.host);

    // Relative URLs (no host) are internal
    const isRelative = !href.startsWith("http://") && !href.startsWith("https://");
    if (isRelative) return true;

    // Absolute but on one of your internal hosts
    return INTERNAL_HOSTS.has(host);
  } catch {
    // If parsing fails, treat as external conservatively
    return false;
  }
}

/** Specifically: is it an internal *docs* link? */
export function isInternalDocs(href: string) {
  try {
    const u = new URL(href, "http://localhost:3000");
    if (!isInternalUrl(href)) return false;
    const path = normalizePathname(u.pathname);
    return path.startsWith(DOCS_PREFIX);
  } catch {
    return false;
  }
}

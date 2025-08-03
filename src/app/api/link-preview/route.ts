import { NextRequest, NextResponse } from "next/server";

function pick<T extends string>(obj: Record<string, string>, keys: T[]) {
  const out = {} as Record<T, string | undefined>;
  for (const k of keys) out[k] = obj[k];
  return out;
}

export const revalidate = 86400; // cache for 1 day

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "LinkPreviewBot/1.0" },
    });
    const type = res.headers.get("content-type") || "";
    if (!type.includes("text/html")) {
      return NextResponse.json({ url, title: new URL(url).hostname });
    }

    const html = await res.text();

    // cheap meta extraction (avoid heavy deps). Good enough for tooltips.
    const get = (name: string, prop = "name") => {
      const m = html.match(
        new RegExp(
          `<meta[^>]+${prop}=["']${name}["'][^>]+content=["']([^"']+)["']`,
          "i"
        )
      );
      return m?.[1];
    };

    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    const meta = {
      ogTitle: get("og:title", "property"),
      ogDesc: get("og:description", "property"),
      ogImage: get("og:image", "property"),
      desc: get("description"),
      iconHref: html.match(
        /<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i
      )?.[1],
    };

    // normalize icon to absolute
    let icon = meta.iconHref;
    if (icon && !/^https?:\/\//i.test(icon)) {
      const u = new URL(url);
      icon = icon.startsWith("/")
        ? `${u.origin}${icon}`
        : `${u.origin}/${icon}`;
    }

    const data = {
      url,
      host: new URL(url).hostname,
      title: meta.ogTitle || title || new URL(url).hostname,
      description: meta.ogDesc || meta.desc || "",
      image: meta.ogImage,
      icon,
    };

    // basic trimming to keep tooltips small
    if (data.description.length > 220)
      data.description = data.description.slice(0, 217) + "…";

    return NextResponse.json(
      pick(data as Record<string, string>, [
        "url",
        "host",
        "title",
        "description",
        "image",
        "icon",
      ])
    );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return NextResponse.json(
      { url, title: new URL(url).hostname },
      { status: 200 }
    );
  }
}

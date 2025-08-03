"use client";

import { useEffect, useState } from "react";

type Preview = {
  url: string;
  host?: string;
  title?: string;
  description?: string;
  image?: string;
  icon?: string;
};

export function ExternalLinkPreview({ href }: { href: string }) {
  const [data, setData] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/link-preview?url=${encodeURIComponent(href)}`)
      .then(r => r.json())
      .then(d => { if (mounted) setData(d); })
      .catch(() => { if (mounted) setData(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [href]);

  if (loading) return <div className="text-sm opacity-70">Loading preview…</div>;
  if (!data) return <div className="text-sm opacity-70">No preview</div>;

  return (
    <div className="flex gap-3 items-start max-w-[38ch]">
      {data.image ? (
        <img src={data.image} alt="" className="h-14 w-20 object-cover rounded-md flex-none" />
      ) : null}
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{data.title || data.host}</div>
        {data.description ? (
          <div className="text-xs opacity-80 line-clamp-3">{data.description}</div>
        ) : null}
        <div className="mt-1 flex items-center gap-2 text-xs opacity-70">
          {data.icon ? <img src={data.icon} alt="" className="h-3.5 w-3.5 rounded-sm" /> : null}
          <span className="truncate">{data.host}</span>
        </div>
      </div>
    </div>
  );
}

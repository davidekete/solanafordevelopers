import Link, { LinkProps } from "next/link";
import { source } from "@/lib/source";
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/page";
import { getMDXComponents } from "@/mdx-components";
import { createRelativeLink } from "fumadocs-ui/mdx";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ReactNode } from "react";
import { Url } from "next/dist/shared/lib/router/router";
import { GlossaryMeaning } from "./GlossaryMeaning";
import { isInternalDocs, isInternalUrl } from "../lib/config/internalLinks";
import { ExternalLinkPreview } from "./ExternalLinkPreview";



/**
 * Adds a preview to the link
 * Usage: <LinkPrev href={"url"}>anchor tex
 * </LinkPrev>
 * @param param0 
 * @returns JSX
 */
export function LinkPrev({
  children,
  ...props
}: LinkProps & { children: ReactNode }) {
  return (
    <>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Link {...props}>{children} </Link>
        </HoverCardTrigger>
        <HoverCardContent
          align="center"
          side="top"
          className="max-h-[60vh] w-lg overflow-auto"
        >
          {getTooltipContent(props.href)}
        </HoverCardContent>
      </HoverCard>
    </>
  );
}

export function Term({ term }: { term: string }) {
  return (
    <HoverCard>
      <HoverCardTrigger className="underline decoration-dashed">
        {term}
      </HoverCardTrigger>
      <HoverCardContent className="max-w-sm">
        <GlossaryMeaning term={term} />
      </HoverCardContent>
    </HoverCard>
  );
}

function getTooltipContent(href?: Url, textContent?: string) {
  if (!href)
    return (
      <div className="text-sm opacity-70">{textContent ?? "No preview"}</div>
    );

  const hrefStr = href.toString();

  if (isInternalDocs(hrefStr)) {
    // INTERNAL DOCS → your existing MDX preview
    const afterDocs = hrefStr.split("/docs/")[1] ?? "";
    const slug = afterDocs.split("/").filter(Boolean);
    const page = source.getPage(slug);
    if (!page) return "Page not found";

    const MDXContent = page.data.body;
    return (
      <DocsPage footer={{ enabled: false }} breadcrumb={{ enabled: false }}>
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
        <DocsBody>
          <MDXContent
            components={getMDXComponents({
              a: createRelativeLink(source, page),
            })}
          />
        </DocsBody>
      </DocsPage>
    );
  }

  // INTERNAL but not a docs URL → you can choose a different internal preview or fallback
  if (isInternalUrl(hrefStr)) {
    return <div className="text-sm opacity-70">Internal page</div>;
  }

  // EXTERNAL → external preview component
  return <ExternalLinkPreview href={hrefStr} />;
}

// function getTooltipContent(href?: Url, textContent?: string) {
//   if (href) {
//     const slug = href.toString().split("docs")[1].split("/").slice(1);

//     const page = source.getPage(slug);

//     if (!page) return "Page not found";

//     const MDXContent = page.data.body;

//     return (
//       <DocsPage footer={{ enabled: false }} breadcrumb={{ enabled: false }}>
//         <DocsTitle>{page.data.title}</DocsTitle>
//         <DocsDescription>{page.data.description}</DocsDescription>
//         <DocsBody>
//           <MDXContent
//             components={getMDXComponents({
//               // this allows you to link to other pages with relative file paths
//               a: createRelativeLink(source, page),
//             })}
//           />
//         </DocsBody>
//       </DocsPage>
//     );
//   }

//   //Text content for external links (passed or generated)?

//   //If nothing preview
// }

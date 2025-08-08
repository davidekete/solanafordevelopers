import { source } from "@/lib/source";
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { getMDXComponents } from "@/mdx-components";
import Image from "next/image";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;

  console.log("params", params);

  const page = source.getPage(params.slug);

  if (!page) notFound();

  console.log("slug", params.slug);

  const MDXContent = page.data.body;

  return (
    <DocsPage
      tableOfContent={{
        style: "clerk",
        single: false,
        footer: <EditOnGithub path={page.file.path} />,
      }}
      lastUpdate={new Date(page.data.lastModified as Date)}
      toc={page.data.toc}
      full={page.data.full}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

function EditOnGithub({ path }: { path: string }) {
  const href = `https://github.com/davidekete/solanafordevelopers/blob/main/content/docs/${
    path.startsWith("/") ? path.slice(1) : path
  }`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="pt-2 flex items-center gap-2 text-sm text-fd-muted-foreground hover:text-fd-accent-foreground/80"
    >
      <Image alt="" width={18} height={18} src={"/icons/github.svg"} />
      <span>Edit on GitHub</span>
    </a>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

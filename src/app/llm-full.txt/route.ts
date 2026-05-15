import { source } from "@/lib/source";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const BASE_URL = "https://solanafordevs.com";
const CONTENT_DIR = join(process.cwd(), "content/docs");

const SECTION_TITLES: Record<string, string> = {
  introduction: "Getting Started",
  "counter-program": "Counter Program",
  "voting-program": "Voting Program",
  "automated-tests": "Automated Tests",
};

async function getPageContent(slugs: string[]): Promise<string> {
  const candidates = [
    join(CONTENT_DIR, ...slugs) + ".mdx",
    join(CONTENT_DIR, ...slugs, "index.mdx"),
  ];
  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      const raw = await readFile(filePath, "utf-8");
      // Strip frontmatter and import statements
      return raw
        .replace(/^---[\s\S]*?---\n?/, "")
        .replace(/^import\s+.*$/gm, "")
        .trim();
    }
  }
  return "";
}

export async function GET() {
  const pages = source.getPages();

  const sections = new Map<string, typeof pages>();
  for (const page of pages) {
    const section = page.slugs[0];
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section)!.push(page);
  }

  const lines: string[] = [
    "# Solana for Developers",
    "",
    "> A hands-on developer course teaching Solana program development from scratch — starting with native Rust and progressing to Anchor.",
    "",
    "Learn by building real programs: a counter program in native Rust and a full voting program with PDAs, custom errors, and automated tests.",
    "",
  ];

  for (const [section, sectionPages] of sections) {
    lines.push(`## ${SECTION_TITLES[section] ?? section}`);
    lines.push("");

    for (const page of sectionPages) {
      lines.push(`### [${page.data.title}](${BASE_URL}${page.url})`);
      if (page.data.description) lines.push(`> ${page.data.description}`);
      lines.push("");
      const content = await getPageContent(page.slugs);
      if (content) {
        lines.push(content);
        lines.push("");
      }
    }
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

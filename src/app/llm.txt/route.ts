import { source } from "@/lib/source";

const BASE_URL = "https://solanafordevs.com";

const SECTION_TITLES: Record<string, string> = {
  introduction: "Getting Started",
  "counter-program": "Counter Program",
  "voting-program": "Voting Program",
  "automated-tests": "Automated Tests",
};

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
    for (const page of sectionPages) {
      const desc = page.data.description ? `: ${page.data.description}` : "";
      lines.push(`- [${page.data.title}](${BASE_URL}${page.url})${desc}`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

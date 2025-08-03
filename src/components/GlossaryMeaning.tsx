import { glossary } from "../../content/glossary.mdx";

export function GlossaryMeaning({ term }: { term: string }) {
  return <span>{glossary[term as keyof typeof glossary] ?? "Not found"}</span>;
}

import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from "fumadocs-mdx/config";
import { transformerTwoslash } from "fumadocs-twoslash";
import { createFileSystemTypesCache } from "fumadocs-twoslash/cache-fs";
import remarkMath from "remark-math";
import { remarkInstall } from "fumadocs-docgen";
import { remarkTypeScriptToJavaScript } from "fumadocs-docgen/remark-ts2js";
import rehypeKatex from "rehype-katex";
import {
  rehypeCodeDefaultOptions,
  remarkSteps,
} from "fumadocs-core/mdx-plugins";
import { remarkAutoTypeTable } from "fumadocs-typescript";
import { transformerRemoveNotationEscape } from "@shikijs/transformers";

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.vercel.app/docs/mdx/collections#define-docs
export const docs = defineDocs({
  docs: {
    schema: frontmatterSchema,
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  lastModifiedTime: "git",
  mdxOptions: {
    rehypeCodeOptions: {
      lazy: true,
      experimentalJSEngine: true,
      langs: ["ts", "js", "html", "tsx", "mdx"],
      inline: "tailing-curly-colon",
      themes: {
        light: "catppuccin-latte",
        dark: "catppuccin-mocha",
      },
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerTwoslash({
          typesCache: createFileSystemTypesCache(),
        }),
        transformerRemoveNotationEscape(),
      ],
    },
    remarkCodeTabOptions: {
      parseMdx: true,
    },
    remarkPlugins: [
      remarkSteps,
      remarkMath,
      remarkAutoTypeTable,
      [remarkInstall, { persist: { id: "package-manager" } }],
      remarkTypeScriptToJavaScript,
    ],
    rehypePlugins: (v) => [rehypeKatex, ...v],
  },
});

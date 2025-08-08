#!/usr/bin/env node
// /**
//  * Wrap first occurrence of each glossary term per file as:
//  *   <Term term="MatchedText" />
//  *
//  * - Loads terms from an object literal inside an MDX file that contains:
//  *     export const glossary = { ... };
//  * - Preserves YAML front-matter (--- ... ---).
//  * - Skips code blocks, inline code, links, images, HTML, MDX expressions,
//  *   existing <Term> and <LinkPrev> nodes, and the glossary file itself.
//  * - Handles multi-word terms and naive plural forms (s/es) for single words.
//  *
//  * Usage:
//  *   node codemod-wrap-terms-from-glossary-object.mjs \
//  *     --glossary=content/glossary.mdx \
//  *     --glob='content/**/*.mdx' \
//  *     --debug
//  */
// node codemod-wrap-terms.mjs --glossary=../content/glossary.mdx --glob='../content/**/*.mdx' --debug

import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "glob";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkStringify from "remark-stringify";
import remarkFrontmatter from "remark-frontmatter";
import { visit, SKIP } from "unist-util-visit";
import vm from "node:vm";

/* ---------------- CLI args ---------------- */
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const m = a.match(/^--([^=]+)=(.+)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ""), true];
  })
);

const GLOSSARY_FILE = args.glossary || "content/glossary.mdx"; // MDX with `export const glossary = {...}`
const FILE_GLOB = args.glob || "content/**/*.mdx";
const DEBUG = !!args.debug;

/* ---------------- Settings ---------------- */
const CASE_SENSITIVE = false;
const HANDLE_SIMPLE_PLURALS = true;

/* ---------------- Load terms from MDX object ---------------- */
function extractGlossaryObjectLiteral(src) {
  const anchor = "export const glossary";
  const start = src.indexOf(anchor);
  if (start === -1) return null;

  const braceStart = src.indexOf("{", start);
  if (braceStart === -1) return null;

  let i = braceStart, depth = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(braceStart, i + 1);
    }
    i++;
  }
  return null;
}

function loadTermsFromGlossaryObject(file) {
  const src = readFileSync(file, "utf8");
  const objectLiteral = extractGlossaryObjectLiteral(src);
  if (!objectLiteral) {
    console.error(`Could not find 'export const glossary = {...}' in ${file}`);
    return [];
  }
  const wrapped = `module.exports = ${objectLiteral};`;
  const ctx = { module: { exports: {} }, exports: {} };
  vm.createContext(ctx);
  vm.runInContext(wrapped, ctx, { filename: file });
  const obj = ctx.module.exports;
  if (!obj || typeof obj !== "object") {
    console.error(`Glossary object in ${file} is not an object.`);
    return [];
  }
  return Object.keys(obj);
}

const TERMS = loadTermsFromGlossaryObject(GLOSSARY_FILE);
if (DEBUG) console.log("Loaded terms:", TERMS.join(", "));

if (!TERMS.length) {
  console.error(`No terms found in ${GLOSSARY_FILE}`);
  process.exit(1);
}

/* ---------------- Build matchers ---------------- */
/** Per-term regexes (to resolve which canonical term a match belongs to) + a combined scanner */
function buildMatchers(terms) {
  const flags = CASE_SENSITIVE ? "gu" : "giu";
  const perTerm = terms.map((t) => {
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (/\s/.test(t)) {
      // multi-word exact phrase
      return { term: t, re: new RegExp(`^\\b${esc}\\b$`, flags) };
    } else {
      const base = `\\b${esc}\\b`;
      const plural = HANDLE_SIMPLE_PLURALS ? `\\b${esc}(?:es|s)\\b` : null;
      const src = plural ? `^(?:${base}|${plural})$` : `^${base}$`;
      return { term: t, re: new RegExp(src, flags) };
    }
  });

  const combinedSrc = perTerm
    .map(({ re }) => re.source.replace(/^\^|\$$/g, "")) // strip ^$
    .join("|");

  return {
    perTerm,
    combined: new RegExp(`(${combinedSrc})`, flags),
  };
}

const { perTerm: MATCHERS, combined: COMBINED } = buildMatchers(TERMS);

function canonicalForMatch(matchText) {
  for (const { term, re } of MATCHERS) {
    if (re.test(matchText)) {
      return CASE_SENSITIVE ? term : term.toLowerCase();
    }
  }
  return CASE_SENSITIVE ? matchText : matchText.toLowerCase();
}

/* ---------------- Transform ---------------- */
const SKIP_PARENTS = new Set([
  "yaml",                // front-matter
  "link","linkReference","definition",
  "image","imageReference",
  "code","inlineCode",
  "html",
  "mdxFlowExpression","mdxTextExpression",
]);

function isInsideTermOrLinkPrev(parent) {
  if (!parent) return false;
  if (parent.type === "mdxJsxTextElement" || parent.type === "mdxJsxFlowElement") {
    const name = parent.name || "";
    return name === "Term" || name === "LinkPrev";
  }
  return false;
}

/** Replace matches in a text node with text + <Term/> nodes, but only first occurrence per term per file */
function splitTextNode(value, wrappedOnce) {
  if (!COMBINED) return null;
  let m, last = 0;
  const out = [];
  while ((m = COMBINED.exec(value))) {
    const start = m.index, end = COMBINED.lastIndex;
    if (start > last) out.push({ type: "text", value: value.slice(last, start) });

    const matched = m[0];               // visible text (keeps casing)
    const key = canonicalForMatch(matched); // canonical per glossary key

    if (wrappedOnce.has(key)) {
      // already wrapped once in this file: leave as plain text
      out.push({ type: "text", value: matched });
    } else {
      wrappedOnce.add(key);
      out.push({
        type: "mdxJsxTextElement",
        name: "Term",
        attributes: [{ type: "mdxJsxAttribute", name: "term", value: matched }],
        children: [], // self-closing
      });
    }

    last = end;
  }
  if (last === 0) return null;
  if (last < value.length) out.push({ type: "text", value: value.slice(last) });
  return out;
}

function transform(tree, wrappedOnce) {
  visit(tree, (node, index, parent) => {
    if (!parent || index == null) return;
    if (SKIP_PARENTS.has(parent.type)) return SKIP;
    if (isInsideTermOrLinkPrev(parent)) return SKIP;

    if (node.type === "text" && /\w/.test(node.value || "")) {
      const replaced = splitTextNode(node.value, wrappedOnce);
      if (replaced) {
        parent.children.splice(index, 1, ...replaced);
        return [SKIP, index + replaced.length];
      }
    }
  });
}

/* ---------------- Process files ---------------- */
function processFile(file) {
  const orig = readFileSync(file, "utf8");

  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"]) // preserve front-matter
    .use(remarkMdx)
    .use(remarkStringify, {
      bullet: "-",
      fences: true,
      listItemIndent: "one",
    });

  const ast = processor.parse(orig);
  const wrappedOnce = new Set(); // per-file tracker
  transform(ast, wrappedOnce);
  const out = processor.stringify(ast);

  if (out !== orig) {
    writeFileSync(file, out, "utf8");
    console.log("Updated:", file);
  } else if (DEBUG) {
    console.log("No changes:", file);
  }
}

function main() {
  const files = globSync(FILE_GLOB, { nodir: true });
  const targets = files.filter(f => f !== GLOSSARY_FILE);
  if (DEBUG) console.log("Files to scan:", targets.length);
  for (const f of targets) processFile(f);
}

main();

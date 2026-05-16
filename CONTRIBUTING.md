# Contributing

Thank you for helping improve this course. Contributions can range from fixing a typo to adding a full lesson.

## Setup

**Prerequisites:** Node.js 20+, pnpm 9+

```bash
pnpm install
pnpm dev
```

The site is available at `http://localhost:3000`.

## Content

All course content lives in `content/docs/` as MDX files. Pages are grouped into modules:

```text
content/docs/
├── introduction/
├── counter-program/
├── voting-program/
└── automated-tests/
```

Each module has an `index.mdx` that serves as its overview page. New pages within a module go alongside it. Add a new module by creating a new directory with an `index.mdx`.

### Front Matter

Every MDX file must have a front matter block with `title` and `description`. `icon` is optional and accepts any [Lucide](https://lucide.dev/icons/) icon name.

```mdx
---
title: Your Page Title
description: A concise description of what this page covers.
icon: BookOpen
---
```

The CI `frontmatter` job validates all files against this schema and will fail if either required field is missing.

### Writing Style

- Introduce tools and concepts only when they are needed — do not front-load theory.
- Each lesson should build on the previous one.
- Prefer short, direct sentences.

### Spell Check

Run spell check before opening a PR:

```bash
pnpm exec cspell "content/**/*.mdx" --no-progress
```

If a word is flagged but correct (e.g. a Solana-specific term or crate name), add it to the `words` array in [`cspell.config.json`](cspell.config.json).

### Links

Internal links should use the `/docs/` path prefix and must resolve to an existing page:

```mdx
[Counter program](/docs/counter-program)
```

External links are checked with [lychee](https://lychee.cli.rs) against a running local server. Social and community URLs (GitHub, Twitter/X, Discord, LinkedIn) are excluded — see [`lychee.toml`](lychee.toml).

## Local Checks

Run these before opening a PR to catch what CI will catch:

```bash
pnpm lint                                           # ESLint
pnpm typecheck                                      # TypeScript
pnpm exec cspell "content/**/*.mdx" --no-progress  # Spell check
node scripts/validate-frontmatter.mjs               # Front matter schema
node scripts/check-relative-links.mjs               # Internal links
pnpm build                                          # Full build
```

## CI

Every pull request runs the following jobs automatically:

| Job | What it checks |
| --- | --- |
| Lint & Typecheck | ESLint + `tsc --noEmit` |
| Front Matter Validation | `title` and `description` present on every MDX file |
| Spell Check | cspell against all MDX content |
| Build | `next build` succeeds |
| Bundle Size | Webpack bundle analysis (artifact saved for 30 days) |
| Lighthouse CI | Performance ≥ 70, Accessibility ≥ 90, Best Practices ≥ 80, SEO ≥ 80 |
| Link Check | lychee + embed checker + relative link checker |

All jobs must pass before a PR can be merged.

## License

By contributing, you agree that your contributions will be licensed under the [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/deed.en) license.

/**
 * Validates that every internal /docs/ href in MDX content resolves to an
 * existing file in the content directory. Exits 1 if any link is broken.
 *
 * Handles both JSX attribute forms:
 *   href="/docs/some-page"
 *   href={"/docs/some-page"}
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, extname } from 'path'

function collectMdxFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) files.push(...collectMdxFiles(full))
    else if (extname(entry) === '.mdx') files.push(full)
  }
  return files
}

// Plain:      href="/docs/foo"  or  href='/docs/foo'
// Expression: href={"/docs/foo"}
const HREF_RE = /href=(?:["']|{["'])(\/(docs|blog)[^"'}\s#?]+)/g

const contentRoot = join(process.cwd(), 'content')

function resolveToFile(href) {
  // Strip leading /docs or /blog, trailing slash, query, and hash
  const stripped = href.replace(/^\/(?:docs|blog)/, '').replace(/\/$/, '')
  const segments = stripped.split('/').filter(Boolean)
  const base = join(contentRoot, href.startsWith('/blog') ? 'blog' : 'docs', ...segments)

  return [
    base + '.mdx',
    join(base, 'index.mdx'),
  ]
}

const files = collectMdxFiles(join(contentRoot, 'docs'))
let hasErrors = false
let totalChecked = 0

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const relative = file.replace(process.cwd() + '/', '')

  for (const match of content.matchAll(HREF_RE)) {
    const href = match[1]
    totalChecked++

    const candidates = resolveToFile(href)
    if (!candidates.some(existsSync)) {
      console.error(`✗  ${relative}: broken link → ${href}`)
      console.error(`   tried: ${candidates.map(c => c.replace(process.cwd() + '/', '')).join(', ')}`)
      hasErrors = true
    }
  }
}

if (hasErrors) {
  process.exit(1)
} else {
  console.log(`✓ ${totalChecked} relative link(s) checked across ${files.length} files — all valid`)
}

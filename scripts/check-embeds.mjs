/**
 * Scans MDX content for iframe/embed elements and verifies each source URL
 * is reachable. Exits 1 if any embed is broken.
 */

import { readFileSync, readdirSync, statSync } from 'fs'
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

// Matches <iframe src="..." and <iframe src='...'
const IFRAME_RE = /<iframe[^>]+src=["']([^"']+)["']/gi

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'link-checker/1.0' },
    })
    return { ok: res.status < 400, status: res.status }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

const files = collectMdxFiles(join(process.cwd(), 'content'))
const embeds = []

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  for (const match of content.matchAll(IFRAME_RE)) {
    embeds.push({ file: file.replace(process.cwd() + '/', ''), url: match[1] })
  }
}

if (embeds.length === 0) {
  console.log('✓ No embeds found')
  process.exit(0)
}

console.log(`Checking ${embeds.length} embed(s)...`)
let hasErrors = false

for (const { file, url } of embeds) {
  if (!url.startsWith('http')) {
    console.warn(`⚠  ${file}: relative embed src "${url}" — skipping`)
    continue
  }

  const result = await checkUrl(url)
  if (!result.ok) {
    console.error(`✗  ${file}: unreachable embed ${url} (${result.status ?? result.error})`)
    hasErrors = true
  } else {
    console.log(`✓  ${file}: ${url} (${result.status})`)
  }
}

if (hasErrors) process.exit(1)

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().min(1, 'description is required'),
  icon: z.string().optional(),
})

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return null

  const result = {}
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

function collectMdxFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...collectMdxFiles(full))
    } else if (extname(entry) === '.mdx') {
      files.push(full)
    }
  }
  return files
}

const docsDir = join(process.cwd(), 'content', 'docs')
const files = collectMdxFiles(docsDir)
let hasErrors = false

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const frontmatter = parseFrontmatter(content)

  if (!frontmatter) {
    console.error(`✗ ${file.replace(process.cwd() + '/', '')}: missing frontmatter`)
    hasErrors = true
    continue
  }

  const result = schema.safeParse(frontmatter)
  if (!result.success) {
    const relative = file.replace(process.cwd() + '/', '')
    for (const issue of result.error.issues) {
      console.error(`✗ ${relative}: ${issue.path.join('.')} — ${issue.message}`)
    }
    hasErrors = true
  }
}

if (hasErrors) {
  process.exit(1)
} else {
  console.log(`✓ Validated frontmatter in ${files.length} files`)
}

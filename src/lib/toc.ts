export interface TOCItem {
  id: string
  text: string
}

/**
 * Extracts plain text recursively from any Lexical AST node
 */
export function getLexicalNodeText(node: any): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  if (Array.isArray(node.children)) {
    return node.children.map(getLexicalNodeText).join('')
  }
  return ''
}

/**
 * Normalizes heading text into a clean URL-friendly anchor ID
 */
export function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special characters like ? ! ' " :
    .replace(/[\s_-]+/g, '-') // collapse whitespaces/underscores into dashes
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes

  return slug || 'section'
}

/**
 * Extracts all H2 headings from a Lexical content AST
 * Automatically disambiguates duplicate heading text with unique incrementing suffixes (-1, -2, etc.)
 */
export function extractHeadingsFromLexical(content: any): TOCItem[] {
  if (!content?.root?.children || !Array.isArray(content.root.children)) {
    return []
  }

  const items: TOCItem[] = []
  const slugCounts: Record<string, number> = {}

  for (const node of content.root.children) {
    // Only treat H2 headings as TOC sections (per SOW rules)
    if (node?.type === 'heading' && (node.tag === 'h2' || (!node.tag && node.type === 'heading'))) {
      const text = getLexicalNodeText(node).trim()
      if (!text) continue

      const baseSlug = slugifyHeading(text)
      let id = baseSlug

      if (slugCounts[baseSlug] !== undefined) {
        slugCounts[baseSlug] += 1
        id = `${baseSlug}-${slugCounts[baseSlug]}`
      } else {
        slugCounts[baseSlug] = 0
      }

      items.push({ id, text })
    }
  }

  return items
}

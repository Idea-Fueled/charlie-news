import React from 'react'
import { getLexicalNodeText, slugifyHeading } from '@/lib/toc'

interface RichTextProps {
  content?: any
  fallbackText?: string[]
}

// Lexical format bitmasks
const IS_BOLD = 1
const IS_ITALIC = 2
const IS_STRIKETHROUGH = 4
const IS_UNDERLINE = 8
const IS_CODE = 16
const IS_SUBSCRIPT = 32
const IS_SUPERSCRIPT = 64

export function RichTextRenderer({ content, fallbackText }: RichTextProps) {
  // If raw fallback string array is provided (demo articles)
  if (fallbackText && Array.isArray(fallbackText) && fallbackText.length > 0) {
    return (
      <div className="article-body-content">
        {fallbackText.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </div>
    )
  }

  // If Lexical content exists from Payload CMS
  if (content?.root?.children && Array.isArray(content.root.children)) {
    const slugCounts: Record<string, number> = {}

    return (
      <div className="article-body-content">
        {content.root.children.map((node: any, idx: number) =>
          renderNode(node, idx, slugCounts),
        )}
      </div>
    )
  }

  return (
    <div className="article-body-content">
      <p>No content available for this article.</p>
    </div>
  )
}

function renderNode(
  node: any,
  key: number | string,
  slugCounts?: Record<string, number>,
): React.ReactNode {
  if (!node) return null

  // 1. Text node with formatting (bold, italic, underline, code, strikethrough)
  if (node.type === 'text') {
    let element: React.ReactNode = node.text || ''
    const format = typeof node.format === 'number' ? node.format : 0

    if (format & IS_CODE) {
      element = <code>{element}</code>
    }
    if (format & IS_BOLD) {
      element = <strong>{element}</strong>
    }
    if (format & IS_ITALIC) {
      element = <em>{element}</em>
    }
    if (format & IS_UNDERLINE) {
      element = <u>{element}</u>
    }
    if (format & IS_STRIKETHROUGH) {
      element = <s>{element}</s>
    }
    if (format & IS_SUBSCRIPT) {
      element = <sub>{element}</sub>
    }
    if (format & IS_SUPERSCRIPT) {
      element = <sup>{element}</sup>
    }

    return <React.Fragment key={key}>{element}</React.Fragment>
  }

  // 2. Line break
  if (node.type === 'linebreak') {
    return <br key={key} />
  }

  // 3. Link node
  if (node.type === 'link' || node.type === 'autolink') {
    const url = node.fields?.url || node.url || '#'
    const isExternal = Boolean(node.fields?.newTab || url.startsWith('http'))

    return (
      <a
        key={key}
        href={url}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {node.children?.map((child: any, cIdx: number) =>
          renderNode(child, `${key}-${cIdx}`),
        )}
      </a>
    )
  }

  // 4. Headings
  if (node.type === 'heading') {
    const Tag = (node.tag || 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    let headingId: string | undefined = undefined

    if (Tag === 'h2' && slugCounts) {
      const text = getLexicalNodeText(node).trim()
      if (text) {
        const baseSlug = slugifyHeading(text)
        if (slugCounts[baseSlug] !== undefined) {
          slugCounts[baseSlug] += 1
          headingId = `${baseSlug}-${slugCounts[baseSlug]}`
        } else {
          slugCounts[baseSlug] = 0
          headingId = baseSlug
        }
      }
    }

    return (
      <Tag key={key} id={headingId}>
        {node.children?.map((child: any, cIdx: number) =>
          renderNode(child, `${key}-${cIdx}`, slugCounts),
        )}
      </Tag>
    )
  }

  // 5. Blockquote
  if (node.type === 'quote') {
    return (
      <blockquote key={key}>
        {node.children?.map((child: any, cIdx: number) =>
          renderNode(child, `${key}-${cIdx}`),
        )}
      </blockquote>
    )
  }

  // 6. Lists
  if (node.type === 'list') {
    const ListTag = node.listType === 'number' ? 'ol' : 'ul'
    return (
      <ListTag key={key}>
        {node.children?.map((child: any, cIdx: number) =>
          renderNode(child, `${key}-${cIdx}`),
        )}
      </ListTag>
    )
  }

  // 7. List Item
  if (node.type === 'listitem') {
    return (
      <li key={key}>
        {node.children?.map((child: any, cIdx: number) =>
          renderNode(child, `${key}-${cIdx}`),
        )}
      </li>
    )
  }

  // 8. Paragraph (default block)
  if (node.type === 'paragraph' || !node.type) {
    // If paragraph is completely empty, render empty space or break
    if (!node.children || node.children.length === 0) {
      return <p key={key}>&nbsp;</p>
    }

    return (
      <p key={key}>
        {node.children.map((child: any, cIdx: number) =>
          renderNode(child, `${key}-${cIdx}`),
        )}
      </p>
    )
  }

  // Fallback: render any children if available
  if (Array.isArray(node.children)) {
    return (
      <React.Fragment key={key}>
        {node.children.map((child: any, cIdx: number) =>
          renderNode(child, `${key}-${cIdx}`),
        )}
      </React.Fragment>
    )
  }

  return null
}

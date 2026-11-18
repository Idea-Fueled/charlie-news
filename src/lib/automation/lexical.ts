/**
 * Converts structured text sections into a Payload CMS Lexical AST
 */

export interface TableRowData {
  cells: string[]
  isHeader?: boolean
}

export interface TableData {
  rows: TableRowData[]
}

export interface ArticleSectionContent {
  heading?: string
  paragraphs: string[]
  table?: TableData
}

function isMarkdownTable(text: string): boolean {
  const lines = text.trim().split('\n').map((l) => l.trim())
  return (
    lines.length >= 2 &&
    lines[0].startsWith('|') &&
    lines[0].endsWith('|') &&
    lines.some((l) => l.includes('---'))
  )
}

function parseMarkdownTable(text: string): any {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'))

  const rows: any[] = []
  let isHeader = true

  for (const line of lines) {
    // Skip separator lines like | --- | --- |
    if (/^\|(\s*:?-+:?\s*\|)+$/.test(line)) {
      isHeader = false
      continue
    }

    const cells = line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim())

    rows.push({
      type: 'tablerow',
      version: 1,
      children: cells.map((cellText) => ({
        type: 'tablecell',
        version: 1,
        headerState: isHeader ? 1 : 0,
        children: [
          {
            type: 'paragraph',
            version: 1,
            direction: 'ltr',
            format: '',
            indent: 0,
            children: [
              {
                type: 'text',
                text: cellText,
                format: isHeader ? 1 : 0,
                mode: 'normal',
                style: '',
                detail: 0,
                version: 1,
              },
            ],
          },
        ],
      })),
    })

    if (isHeader) {
      isHeader = false
    }
  }

  return {
    type: 'table',
    version: 1,
    children: rows,
  }
}

function buildTableNode(table: TableData): any {
  return {
    type: 'table',
    version: 1,
    children: table.rows.map((row) => ({
      type: 'tablerow',
      version: 1,
      children: row.cells.map((cellText) => ({
        type: 'tablecell',
        version: 1,
        headerState: row.isHeader ? 1 : 0,
        children: [
          {
            type: 'paragraph',
            version: 1,
            direction: 'ltr',
            format: '',
            indent: 0,
            children: [
              {
                type: 'text',
                text: cellText.trim(),
                format: row.isHeader ? 1 : 0,
                mode: 'normal',
                style: '',
                detail: 0,
                version: 1,
              },
            ],
          },
        ],
      })),
    })),
  }
}

export function buildLexicalBody(sections: ArticleSectionContent[]): any {
  const children: any[] = []

  for (const sec of sections) {
    if (sec.heading && sec.heading.trim()) {
      children.push({
        type: 'heading',
        tag: 'h2',
        children: [
          {
            type: 'text',
            text: sec.heading.trim(),
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      })
    }

    if (Array.isArray(sec.paragraphs)) {
      for (const p of sec.paragraphs) {
        if (!p || !p.trim()) continue

        // Check if paragraph contains markdown table
        if (isMarkdownTable(p)) {
          children.push(parseMarkdownTable(p))
          continue
        }

        children.push({
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: p.trim(),
              format: 0,
              mode: 'normal',
              style: '',
              detail: 0,
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        })
      }
    }

    // If structured table data is present on the section
    if (sec.table && Array.isArray(sec.table.rows) && sec.table.rows.length > 0) {
      children.push(buildTableNode(sec.table))
    }
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children,
    },
  }
}

/**
 * Converts structured text sections into a Payload CMS Lexical AST
 */

export interface ArticleSectionContent {
  heading?: string
  paragraphs: string[]
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

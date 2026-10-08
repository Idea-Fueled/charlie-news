/**
 * Article Draft Validation for Charlie News
 * Strictly enforces SOW constraints before saving to the database
 */

import { AUTOMATION_CONFIG } from '@/config/automation'
import type { ArticleSectionContent } from './lexical'

export interface ArticleDraftCandidate {
  headline: string
  summary: string
  seoDescription: string
  sectionId: string | number
  sections: ArticleSectionContent[]
  sourceName: string
  sourceUrl: string
  sourceSnippet?: string
  photoSearchWords?: string
  imageAlt?: string
  aiNote?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  wordCount: number
  subheadingsCount: number
}

/**
 * Counts total words across an array of text paragraphs
 */
export function countWords(text: string): number {
  if (!text) return 0
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

/**
 * Validates generated draft candidate against all SOW rules
 */
export function validateArticleDraft(candidate: ArticleDraftCandidate): ValidationResult {
  const errors: string[] = []

  // 1. Required fields presence
  if (!candidate.headline || !candidate.headline.trim()) {
    errors.push('Missing required headline.')
  }
  if (!candidate.summary || !candidate.summary.trim()) {
    errors.push('Missing required summary.')
  }
  if (!candidate.seoDescription || !candidate.seoDescription.trim()) {
    errors.push('Missing required seoDescription.')
  }
  if (!candidate.sectionId) {
    errors.push('Missing required section assignment.')
  }
  if (!candidate.sourceUrl || !candidate.sourceUrl.trim()) {
    errors.push('Missing original sourceUrl.')
  }
  if (!candidate.sourceName || !candidate.sourceName.trim()) {
    errors.push('Missing original sourceName.')
  }

  // 2. Character length constraints
  if (candidate.headline && candidate.headline.length > AUTOMATION_CONFIG.MAX_HEADLINE_LENGTH) {
    errors.push(
      `Headline exceeds ${AUTOMATION_CONFIG.MAX_HEADLINE_LENGTH} characters (${candidate.headline.length} chars).`,
    )
  }

  if (candidate.summary && candidate.summary.length > AUTOMATION_CONFIG.MAX_SUMMARY_LENGTH) {
    errors.push(
      `Summary exceeds ${AUTOMATION_CONFIG.MAX_SUMMARY_LENGTH} characters (${candidate.summary.length} chars).`,
    )
  }

  if (
    candidate.seoDescription &&
    candidate.seoDescription.length > AUTOMATION_CONFIG.MAX_SEO_DESC_LENGTH
  ) {
    errors.push(
      `SEO Description exceeds ${AUTOMATION_CONFIG.MAX_SEO_DESC_LENGTH} characters (${candidate.seoDescription.length} chars).`,
    )
  }

  // 3. Subheadings & Structure
  const subheadings = (candidate.sections || []).filter((s) => Boolean(s.heading?.trim()))
  const subheadingsCount = subheadings.length

  if (subheadingsCount < AUTOMATION_CONFIG.MIN_SUBHEADINGS) {
    errors.push(
      `Article has only ${subheadingsCount} subheading(s). Minimum required is ${AUTOMATION_CONFIG.MIN_SUBHEADINGS}.`,
    )
  }

  if (subheadingsCount > AUTOMATION_CONFIG.MAX_SUBHEADINGS) {
    errors.push(
      `Article has ${subheadingsCount} subheadings. Maximum allowed is ${AUTOMATION_CONFIG.MAX_SUBHEADINGS}.`,
    )
  }

  // 4. Word count calculation (400 - 700 words)
  let totalText = ''
  for (const s of candidate.sections || []) {
    if (s.heading) totalText += ` ${s.heading}`
    for (const p of s.paragraphs || []) {
      totalText += ` ${p}`
    }
  }

  const wordCount = countWords(totalText)

  if (wordCount < AUTOMATION_CONFIG.MIN_WORD_COUNT) {
    errors.push(
      `Article body is ${wordCount} words. SOW requires at least ${AUTOMATION_CONFIG.MIN_WORD_COUNT} words.`,
    )
  }

  if (wordCount > AUTOMATION_CONFIG.MAX_WORD_COUNT) {
    errors.push(
      `Article body is ${wordCount} words. SOW requires no more than ${AUTOMATION_CONFIG.MAX_WORD_COUNT} words.`,
    )
  }

  // 5. Check against blatant verbatim plagiarism of source snippet
  if (candidate.sourceSnippet && candidate.sourceSnippet.trim().length > 100) {
    const cleanSnippet = candidate.sourceSnippet.toLowerCase().replace(/\s+/g, ' ').trim()
    const cleanBody = totalText.toLowerCase().replace(/\s+/g, ' ').trim()

    // If source snippet of 120+ chars is a verbatim substring of generated text
    if (cleanSnippet.length > 150 && cleanBody.includes(cleanSnippet.slice(0, 150))) {
      errors.push('Generated content contains verbatim copied source wording from the source snippet.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    wordCount,
    subheadingsCount,
  }
}

/**
 * Charlie News Claude Automation Configuration
 * Strictly adheres to the SOW limits and pricing rules
 */

export interface ModelPricing {
  inputPerMillion: number
  outputPerMillion: number
}

// Model pricing as of Anthropic official documentation
export const CLAUDE_MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-3-5-sonnet-20241022': {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
  'claude-sonnet-4-6': {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
  'claude-3-5-sonnet-latest': {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
  'claude-3-haiku-20240307': {
    inputPerMillion: 0.25,
    outputPerMillion: 1.25,
  },
  'claude-haiku-4-5-20251001': {
    inputPerMillion: 0.25,
    outputPerMillion: 1.25,
  },
}

export const AUTOMATION_CONFIG = {
  // SOW Rules
  MAX_RUNS_PER_DAY: 4,
  MAX_DRAFTS_PER_RUN: 2,
  MAX_DRAFTS_PER_DAY: 8,
  DUPLICATE_WINDOW_DAYS: 14,

  // Word count & field limits
  MIN_WORD_COUNT: 400,
  MAX_WORD_COUNT: 700,
  MAX_HEADLINE_LENGTH: 90,
  MAX_SUMMARY_LENGTH: 200,
  MAX_SEO_DESC_LENGTH: 160,
  MIN_SUBHEADINGS: 2,
  MAX_SUBHEADINGS: 4,

  // Lock timeout (minutes) to prevent deadlocks if a serverless invocation crashes
  LOCK_TIMEOUT_MINUTES: 30,

  // Scheduled Sydney hours (6 AM, 10 AM, 2 PM, 6 PM)
  SCHEDULED_SYDNEY_HOURS: [6, 10, 14, 18] as const,

  // Default model
  DEFAULT_MODEL: 'claude-3-5-sonnet-20241022',
}

export { SCHEDULED_SYDNEY_HOURS, VERCEL_CRON_UTC_HOURS } from '@/lib/automation/timezone'
export * from './rssSources'

import { getVerifiedFeedUrls, isApprovedFeedUrl } from './rssSources'

/**
 * Returns the client-approved list of RSS feed URLs.
 * If APPROVED_RSS_FEEDS env var is configured, parses and validates against approved sources.
 * If not configured or empty, defaults to the client's verified RSS feeds.
 */
export function getApprovedRssFeeds(): string[] {
  const envFeeds = process.env.APPROVED_RSS_FEEDS?.trim()

  if (!envFeeds) {
    return getVerifiedFeedUrls()
  }

  let urls: string[] = []

  // Try JSON parse first (e.g. '["https://example.com/rss"]')
  if (envFeeds.startsWith('[') && envFeeds.endsWith(']')) {
    try {
      const parsed = JSON.parse(envFeeds)
      if (Array.isArray(parsed)) {
        urls = parsed.map((u) => String(u).trim()).filter(Boolean)
      }
    } catch {
      // Fallback to comma-separated
    }
  }

  // Comma or newline separated
  if (urls.length === 0) {
    urls = envFeeds
      .split(/[,\n]/)
      .map((url) => url.trim())
      .filter((url) => Boolean(url) && (url.startsWith('http://') || url.startsWith('https://')))
  }

  // Ensure no unapproved source can be used by validating each URL
  const approvedUrls = urls.filter(isApprovedFeedUrl)
  return approvedUrls.length > 0 ? Array.from(new Set(approvedUrls)) : getVerifiedFeedUrls()
}

/**
 * Calculates estimated cost from token usage
 */
export function calculateEstimatedCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = CLAUDE_MODEL_PRICING[model] || CLAUDE_MODEL_PRICING[AUTOMATION_CONFIG.DEFAULT_MODEL]

  if (!pricing) {
    return 0
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion
  return Number((inputCost + outputCost).toFixed(6))
}

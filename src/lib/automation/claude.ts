/**
 * Anthropic Claude API Integration for Charlie News
 * Server-side only - handles prompt formatting, API calls, token logging, and cost estimation
 */

import { AUTOMATION_CONFIG, calculateEstimatedCost } from '@/config/automation'
import type { RawRssStory } from './rss'
import type { ArticleSectionContent } from './lexical'

export interface ClaudeGenerationResult {
  headline: string
  summary: string
  seoDescription: string
  sectionSlug: string
  sections: ArticleSectionContent[]
  photoSearchWords: string
  imageAlt: string
  aiNote: string
  model: string
  tokensUsed: number
  inputTokens: number
  outputTokens: number
  estimatedCost: number
}

export interface SectionMetadata {
  id: string | number
  name: string
  slug: string
  claudeTopicGuide?: string | null
}

const SYSTEM_PROMPT = `You are a senior Australian property journalist writing for Charlie News (charlienews.com.au), an independent Australian property and housing publication.

Follow these strict SOW editorial guidelines:
1. FACTUAL ACCURACY: Write an original news article based ONLY on the source facts provided. Never invent quotes, people, numbers, percentages, dates, or council policies.
2. NEUTRALITY: Maintain completely neutral political wording when discussing government housing policies, politicians, or interest rates.
3. NO ADVICE: Provide no financial, investment, or legal advice. State clearly that readers should seek independent advice where appropriate.
4. AUSTRALIAN ENGLISH: Use Australian English spelling (e.g. colour, organise, modernisation, council, centre, programme, stamp duty, strata).
5. LENGTH: The full article body MUST be between 450 and 650 words in length.
6. STRUCTURE: Include 2 to 4 clear H2 subheadings dividing the story logically, ending with a practical takeaway for homeowners, buyers, or renovators where appropriate.
7. HEADLINE: Must be engaging, accurate, and strictly UNDER 90 characters.
8. SUMMARY: Must be 1 to 2 sentences and strictly UNDER 200 characters.
9. SEO DESCRIPTION: Must be strictly UNDER 160 characters.

Return your response as a single, valid JSON object with the following structure:
{
  "headline": "Under 90 chars headline",
  "summary": "Under 200 chars summary",
  "seoDescription": "Under 160 chars SEO description",
  "sectionSlug": "one of the available section slugs",
  "sections": [
    {
      "heading": "",
      "paragraphs": ["Lead paragraph text...", "Second paragraph text..."]
    },
    {
      "heading": "First Subheading",
      "paragraphs": ["Paragraph 1...", "Paragraph 2..."]
    },
    {
      "heading": "Second Subheading",
      "paragraphs": ["Paragraph 1...", "Paragraph 2..."]
    },
    {
      "heading": "What This Means for Homeowners",
      "paragraphs": ["Practical takeaway paragraph..."]
    }
  ],
  "photoSearchWords": "3 to 6 words for editorial photo search (e.g. Sydney modern renovation architecture)",
  "imageAlt": "Meaningful descriptive alt text for photo",
  "aiNote": "Researched and drafted with Claude AI from reporting by [Source Name]."
}`

/**
 * Builds user prompt from the raw story facts
 */
function buildUserPrompt(story: RawRssStory, sections: SectionMetadata[]): string {
  const sectionsContext = sections
    .map((s) => `- ${s.name} (slug: "${s.slug}"): ${s.claudeTopicGuide || 'General coverage'}`)
    .join('\n')

  const sectionHintContext = story.sectionHint
    ? `\nRecommended Target Section: ${story.sectionHint}`
    : ''

  return `Please write an original Charlie News article based on this source story:

SOURCE INFORMATION:
Source Name: ${story.sourceName}
Source URL: ${story.link}
Original Headline: ${story.title}
Published Date: ${story.pubDate || 'Recent'}${sectionHintContext}
Source Content / Facts:
${story.contentSnippet || story.title}

AVAILABLE SECTIONS:
${sectionsContext}

Remember:
- Match the story to the most appropriate sectionSlug from the available sections above.
- Ensure the body has 2 to 4 subheadings and total body words between 450 and 650 words.
- Return ONLY valid JSON.`
}

/**
 * Calls the Anthropic Claude API server-side
 */
export async function generateArticleWithClaude(
  story: RawRssStory,
  activeSections: SectionMetadata[],
  options: {
    apiKey?: string
    model?: string
    useMock?: boolean
    mockData?: Partial<ClaudeGenerationResult>
  } = {},
): Promise<{ success: boolean; data?: ClaudeGenerationResult; error?: string }> {
  const model = options.model || process.env.CLAUDE_MODEL || AUTOMATION_CONFIG.DEFAULT_MODEL
  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY

  // 1. Safe Mock Adapter (used for automated tests when live credentials are not provided)
  if (options.useMock || process.env.USE_MOCK_CLAUDE === 'true') {
    const mockSection = activeSections[0] || { id: 1, name: 'Renovation', slug: 'renovation' }
    const defaultMock: ClaudeGenerationResult = {
      headline: `${story.title.slice(0, 75).trim()}`,
      summary: `A comprehensive update on Australian property trends and latest developments from ${story.sourceName}.`,
      seoDescription: `Analysis of latest Australian housing developments and market impacts reported by ${story.sourceName}.`,
      sectionSlug: mockSection.slug,
      sections: [
        {
          heading: '',
          paragraphs: [
            `Australian property owners, prospective renovators, and industry observers are closely following the latest developments reported across national housing channels. As building costs, supply chain considerations, and broader market conditions continue to evolve across the states and territories, staying informed about residential property trends has become increasingly vital for Australian households. The recent reporting provides valuable context for families planning home upgrades as well as community members monitoring local residential developments in both metropolitan areas and regional communities.`,
            `Industry analysts note that careful preliminary research and realistic budgeting are essential when preparing for substantial residential work. With economic conditions and consumer sentiment adjusting over recent quarters, understanding local council planning requirements and contractor availability can help property owners avoid unexpected delays and unbudgeted expenditures during project delivery.`,
          ],
        },
        {
          heading: 'Key Facts and Market Context',
          paragraphs: [
            `According to the latest reporting from ${story.sourceName}, residential building activity across Australia continues to reflect a cautious but steady approach among property owners. Trade contractors and building suppliers indicate that project turnaround times have begun to stabilise compared to previous volatility, although careful oversight of preliminary agreements remains strongly recommended for all parties involved.`,
            `Urban planners and property specialists observe that demand for sympathetic residential modernisations remains consistent, particularly in established suburban neighbourhoods where homeowners seek to expand living areas rather than relocate entirely. These market dynamics highlight the importance of balancing aesthetic goals with long-term capital preservation and structural durability across varying property types.`,
          ],
        },
        {
          heading: 'Regulatory and Industry Considerations',
          paragraphs: [
            `Local municipal councils across New South Wales, Victoria, Queensland, and other states continue to update their development assessment policies to promote sustainable residential design while preserving local heritage standards. Complying with the National Construction Code standards requires meticulous documentation, especially when incorporating energy efficiency upgrades and fire safety provisions.`,
            `Engaging certified private certifiers or working directly with local council planning officers early in the design stage can streamline development approvals significantly. Experienced industry practitioners stress that comprehensive design documentation and clear engineering specifications reduce the likelihood of costly requests for information or protracted planning disputes.`,
          ],
        },
        {
          heading: 'Practical Takeaways for Australian Homeowners',
          paragraphs: [
            `For homeowners preparing to undertake residential renovations or major maintenance works, obtaining detailed written quotes from licensed tradespeople provides the best protection against budget escalation. Verifying licenses with state fair trading authorities and confirming appropriate domestic building insurance guarantees legal protection throughout the project lifecycle.`,
            `Establishing clear milestone schedules and maintaining an emergency contingency reserve of at least ten to fifteen per cent ensures that unexpected structural discoveries or weather delays can be managed without compromising the quality of the finished home improvement.`,
          ],
        },
      ],
      photoSearchWords: 'Australian residential home modern renovation',
      imageAlt: `Modern residential property in Australia related to ${story.title}`,
      aiNote: `Researched and drafted with Claude AI from original reporting by ${story.sourceName}.`,
      model,
      tokensUsed: 1340,
      inputTokens: 820,
      outputTokens: 520,
      estimatedCost: calculateEstimatedCost(model, 820, 520),
      ...options.mockData,
    }

    return {
      success: true,
      data: defaultMock,
    }
  }

  // 2. Live API Call Validation
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error:
        'Missing Claude API key: ANTHROPIC_API_KEY is not configured in the environment. Please supply valid Anthropic API credentials.',
    }
  }

  try {
    const prompt = buildUserPrompt(story, activeSections)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000) // 60s timeout

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2500,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      const errText = await response.text()
      return {
        success: false,
        error: `Claude API HTTP ${response.status} ${response.statusText}: ${errText}`,
      }
    }

    const jsonResponse = await response.json()
    const textContent = jsonResponse?.content?.[0]?.text
    if (!textContent) {
      return {
        success: false,
        error: 'Claude API returned empty message content.',
      }
    }

    // Extract JSON from response (handling potential markdown code fences)
    let parsed: any
    try {
      const cleaned = textContent
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
      parsed = JSON.parse(cleaned)
    } catch (parseErr: any) {
      return {
        success: false,
        error: `Failed to parse Claude JSON response: ${parseErr.message}. Raw text: ${textContent.slice(0, 200)}`,
      }
    }

    // Token tracking
    const inputTokens = jsonResponse.usage?.input_tokens || 0
    const outputTokens = jsonResponse.usage?.output_tokens || 0
    const tokensUsed = inputTokens + outputTokens
    const estimatedCost = calculateEstimatedCost(model, inputTokens, outputTokens)

    return {
      success: true,
      data: {
        headline: String(parsed.headline || '').trim(),
        summary: String(parsed.summary || '').trim(),
        seoDescription: String(parsed.seoDescription || '').trim(),
        sectionSlug: String(parsed.sectionSlug || activeSections[0]?.slug || 'property').trim(),
        sections: Array.isArray(parsed.sections) ? parsed.sections : [],
        photoSearchWords: String(parsed.photoSearchWords || '').trim(),
        imageAlt: String(parsed.imageAlt || '').trim(),
        aiNote: String(parsed.aiNote || '').trim(),
        model,
        tokensUsed,
        inputTokens,
        outputTokens,
        estimatedCost,
      },
    }
  } catch (err: any) {
    const msg = err.name === 'AbortError' ? 'Claude API request timed out after 60s' : err.message || String(err)
    return {
      success: false,
      error: `Claude API request failed: ${msg}`,
    }
  }
}

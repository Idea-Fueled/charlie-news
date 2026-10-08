/**
 * Claude Automation Orchestrator for Charlie News
 * Coordinates RSS fetching, duplicate protection, Claude draft generation,
 * validation, Lexical transformation, Review Queue draft creation, and run logging.
 */

import type { Payload } from 'payload'
import {
  AUTOMATION_CONFIG,
  getApprovedRssFeeds,
  isApprovedFeedUrl,
  getSectionHintForFeedUrl,
} from '@/config/automation'
import { fetchRssFeed, RawRssStory } from './rss'
import { createDuplicateChecker, generateSourceFingerprint } from './duplicateCheck'
import {
  generateArticleWithClaude,
  SectionMetadata,
  ClaudeGenerationResult,
} from './claude'
import { validateArticleDraft } from './validation'
import { buildLexicalBody } from './lexical'
import { acquireRunLock, releaseRunLock } from './runLock'
import { resolveArticlePhoto, PhotoSearchOptions } from './photos'

export interface AutomationExecutionOptions {
  force?: boolean // Bypass daily cap for authorized manual test runs
  rssFeeds?: string[] // Optional override feeds for testing
  useMock?: boolean // Optional mock adapter for test suites
  mockData?: Partial<ClaudeGenerationResult>
  mockPhotoOptions?: PhotoSearchOptions
}

export interface AutomationExecutionReport {
  success: boolean
  skipped?: boolean
  runId?: string | number
  result: 'Success' | 'Partial' | 'Failed' | 'Skipped'
  storiesChecked: number
  draftsCreated: number
  photosAssigned: number
  draftIds: (string | number)[]
  errors: string[]
  tokensUsed: number
  estimatedCost: number
  message: string
}

function slugifyHeadline(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'article'
  )
}

async function generateUniqueSlug(payload: Payload, baseSlug: string): Promise<string> {
  let candidateSlug = baseSlug
  let count = 0

  while (true) {
    const existing = await payload.find({
      collection: 'articles',
      where: {
        slug: { equals: candidateSlug },
      },
      limit: 1,
      depth: 0,
    })

    if (!existing.totalDocs || existing.totalDocs === 0) {
      return candidateSlug
    }

    count += 1
    candidateSlug = `${baseSlug}-${count}`
  }
}

export async function runClaudeAutomation(
  payload: Payload,
  options: AutomationExecutionOptions = {},
): Promise<AutomationExecutionReport> {
  const runStartTime = Date.now()
  const errorLogs: string[] = []
  let storiesChecked = 0
  let draftsCreated = 0
  let photosAssigned = 0
  const draftIds: (string | number)[] = []
  let totalTokensUsed = 0
  let totalEstimatedCost = 0

  // 1. Acquire Run Lock and check daily caps
  const lock = await acquireRunLock(payload, { force: options.force })
  if (!lock.acquired) {
    return {
      success: false,
      skipped: true,
      result: 'Skipped',
      storiesChecked: 0,
      draftsCreated: 0,
      photosAssigned: 0,
      draftIds: [],
      errors: [lock.reason || 'Run lock acquisition rejected.'],
      tokensUsed: 0,
      estimatedCost: 0,
      message: lock.reason || 'Skipped due to active lock or daily limit.',
    }
  }

  const runId = lock.runId!

  try {
    // 2. Fetch Active Sections from Payload CMS
    const sectionsData = await payload.find({
      collection: 'sections',
      where: {
        status: { equals: 'Active' },
      },
      sort: 'menuOrder',
      limit: 50,
      depth: 0,
    })

    const activeSections: SectionMetadata[] = (sectionsData.docs || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      claudeTopicGuide: s.claudeTopicGuide || null,
    }))

    if (activeSections.length === 0) {
      const msg = 'No Active sections found in CMS. Unable to categorize stories.'
      errorLogs.push(msg)
      await releaseRunLock(payload, runId, {
        result: 'Failed',
        storiesChecked: 0,
        draftsCreated: 0,
        errors: msg,
        tokensUsed: 0,
        estimatedCost: 0,
      })

      return {
        success: false,
        runId,
        result: 'Failed',
        storiesChecked: 0,
        draftsCreated: 0,
        photosAssigned: 0,
        draftIds: [],
        errors: [msg],
        tokensUsed: 0,
        estimatedCost: 0,
        message: msg,
      }
    }

    // 3. Determine Approved RSS Feeds List
    const candidateFeeds = options.rssFeeds || getApprovedRssFeeds()
    // Enforce approved client feeds check and deduplicate for runtime efficiency
    const rssFeedUrls = Array.from(new Set(candidateFeeds.filter(isApprovedFeedUrl)))
    if (rssFeedUrls.length === 0) {
      const msg =
        'No approved RSS feeds configured in APPROVED_RSS_FEEDS. Awaiting client RSS source list.'
      errorLogs.push(msg)

      await releaseRunLock(payload, runId, {
        result: 'Success',
        storiesChecked: 0,
        draftsCreated: 0,
        errors: msg,
        tokensUsed: 0,
        estimatedCost: 0,
      })

      return {
        success: true,
        runId,
        result: 'Success',
        storiesChecked: 0,
        draftsCreated: 0,
        photosAssigned: 0,
        draftIds: [],
        errors: errorLogs,
        tokensUsed: 0,
        estimatedCost: 0,
        message: msg,
      }
    }

    // 4. Fetch Available Stories from Approved RSS Sources concurrently
    const rssStartTime = Date.now()
    const feedPromises = rssFeedUrls.map(async (feedUrl) => {
      const feedResult = await fetchRssFeed(feedUrl)
      return { feedUrl, feedResult }
    })
    const settledFeeds = await Promise.allSettled(feedPromises)
    const rawStories: RawRssStory[] = []

    for (const item of settledFeeds) {
      if (item.status === 'fulfilled') {
        const { feedUrl, feedResult } = item.value
        if (!feedResult.success) {
          errorLogs.push(`RSS source failure: ${feedResult.error}`)
        } else {
          const sectionHint = getSectionHintForFeedUrl(feedUrl)
          for (const story of feedResult.stories) {
            rawStories.push({
              ...story,
              feedUrl,
              sectionHint: sectionHint || undefined,
            })
          }
        }
      } else {
        errorLogs.push(`RSS source exception: ${item.reason?.message || String(item.reason)}`)
      }
    }

    const rssDuration = Date.now() - rssStartTime
    console.log(
      `[Claude Automation] RSS start/end duration: ${rssDuration}ms (${rssFeedUrls.length} feeds fetched, ${rawStories.length} stories collected)`,
    )

    storiesChecked = rawStories.length

    // 5. Filter Stories using 14-Day Duplicate Protection (batch pre-cached in memory)
    const dupStartTime = Date.now()
    const dupChecker = await createDuplicateChecker(payload)
    const eligibleStories: RawRssStory[] = []
    for (const story of rawStories) {
      const dupCheck = dupChecker.isDuplicate(story.link, story.title)
      if (dupCheck.isDuplicate) {
        // Skipped as duplicate
        continue
      }
      eligibleStories.push(story)
    }

    const dupDuration = Date.now() - dupStartTime
    console.log(
      `[Claude Automation] Duplicate check duration: ${dupDuration}ms (${rawStories.length} stories evaluated, ${eligibleStories.length} eligible, ${rawStories.length - eligibleStories.length} duplicates filtered)`,
    )

    // 6. Limit processing to SOW max 2 drafts per run
    const selectedStories = eligibleStories.slice(0, AUTOMATION_CONFIG.MAX_DRAFTS_PER_RUN)

    // 7. Process Selected Stories with Claude
    for (let i = 0; i < selectedStories.length; i++) {
      const story = selectedStories[i]
      const storyLabel = `draft ${i + 1}/${selectedStories.length}`

      const claudeStartTime = Date.now()
      const claudeRes = await generateArticleWithClaude(story, activeSections, {
        useMock: options.useMock,
        mockData: options.mockData,
      })
      const claudeDuration = Date.now() - claudeStartTime
      console.log(
        `[Claude Automation] Claude request duration: ${claudeDuration}ms for ${storyLabel}`,
      )

      if (!claudeRes.success || !claudeRes.data) {
        errorLogs.push(
          `Claude generation failed for story "${story.title}": ${claudeRes.error}`,
        )
        continue
      }

      const generated = claudeRes.data
      totalTokensUsed += generated.tokensUsed
      totalEstimatedCost += generated.estimatedCost

      // Match generated sectionSlug to a database Section ID
      let targetSection = activeSections.find(
        (s) =>
          s.slug.toLowerCase() === generated.sectionSlug.toLowerCase() ||
          s.name.toLowerCase() === generated.sectionSlug.toLowerCase(),
      )
      if (!targetSection && story.sectionHint) {
        targetSection = activeSections.find(
          (s) =>
            s.name.toLowerCase() === story.sectionHint?.toLowerCase() ||
            s.slug.toLowerCase() === story.sectionHint?.toLowerCase(),
        )
      }
      if (!targetSection) {
        targetSection = activeSections[0]
      }

      // 8. Validate Draft against SOW Constraints
      const validation = validateArticleDraft({
        headline: generated.headline,
        summary: generated.summary,
        seoDescription: generated.seoDescription,
        sectionId: targetSection.id,
        sections: generated.sections,
        sourceName: story.sourceName,
        sourceUrl: story.link,
        sourceSnippet: story.contentSnippet,
        photoSearchWords: generated.photoSearchWords,
        imageAlt: generated.imageAlt,
        aiNote: generated.aiNote,
      })

      if (!validation.isValid) {
        errorLogs.push(
          `Validation failed for "${generated.headline}": ${validation.errors.join('; ')}`,
        )
        continue
      }

      // 9. Convert Body to Payload Lexical AST
      const lexicalBody = buildLexicalBody(generated.sections)
      const baseSlug = slugifyHeadline(generated.headline)
      const uniqueSlug = await generateUniqueSlug(payload, baseSlug)
      const fingerprint = generateSourceFingerprint(story.link, story.title)

      // 9.5 Resolve Article Photo via Unsplash (Primary & only automated provider)
      const unsplashStartTime = Date.now()
      const photoResult = await resolveArticlePhoto(generated.photoSearchWords, {
        useMock: options.useMock,
        ...options.mockPhotoOptions,
      })
      const unsplashDuration = Date.now() - unsplashStartTime
      console.log(
        `[Claude Automation] Unsplash duration: ${unsplashDuration}ms for ${storyLabel} (found: ${photoResult.found})`,
      )

      const articleData: any = {
        headline: generated.headline,
        slug: uniqueSlug,
        summary: generated.summary,
        seoDescription: generated.seoDescription,
        body: lexicalBody,
        section:
          typeof targetSection.id === 'string'
            ? parseInt(targetSection.id, 10)
            : (targetSection.id as number),
        status: 'Draft', // Strict SOW requirement: drafts only!
        sourceName: story.sourceName,
        sourceUrl: story.link,
        sourceFingerprint: fingerprint,
        claudeModel: generated.model,
        claudeRunId: String(runId),
      }

      if (photoResult.found) {
        photosAssigned += 1
        articleData.image = {
          url: photoResult.url,
          width: photoResult.width,
          height: photoResult.height,
          source: photoResult.source,
        }
        articleData.imageCredit = {
          name: photoResult.photographer,
          link: photoResult.photographerUrl || photoResult.creditLink,
        }
        articleData.imageSourceId = photoResult.sourceId
        articleData.imageAlt = generated.imageAlt || photoResult.alt || null
        articleData.flags = null
        articleData.flagReasons = null
      } else {
        articleData.flags = ['Needs photo']
        articleData.flagReasons = photoResult.reason
        articleData.imageAlt = generated.imageAlt || null
        errorLogs.push(
          `[Photo Notice] Draft "${generated.headline}": ${photoResult.reason}. Saved with "Needs photo" flag.`,
        )
      }

      // 10. Create Article in Review Queue as DRAFT (Never Auto-Publish)
      const dbWriteStartTime = Date.now()
      try {
        const articleDoc = await payload.create({
          collection: 'articles',
          data: articleData,
        })
        const dbWriteDuration = Date.now() - dbWriteStartTime
        console.log(
          `[Claude Automation] DB write duration: ${dbWriteDuration}ms for ${storyLabel} (article ID: ${articleDoc.id})`,
        )

        draftsCreated += 1
        draftIds.push(articleDoc.id)
      } catch (saveErr: any) {
        const dbWriteDuration = Date.now() - dbWriteStartTime
        console.log(
          `[Claude Automation] DB write duration: ${dbWriteDuration}ms (failed for ${storyLabel})`,
        )
        errorLogs.push(
          `Database save error for "${generated.headline}": ${saveErr.message || String(saveErr)}`,
        )
      }
    }

    // 11. Determine Final Run Outcome
    let runResult: 'Success' | 'Partial' | 'Failed' = 'Success'
    if (errorLogs.length > 0 && draftsCreated > 0) {
      runResult = 'Partial'
    } else if (errorLogs.length > 0 && draftsCreated === 0) {
      runResult = 'Failed'
    }

    const totalDuration = Date.now() - runStartTime
    console.log(
      `[Claude Automation] Total duration: ${totalDuration}ms (result: ${runResult}, drafts: ${draftsCreated})`,
    )

    // 12. Finalize Run Record and Release Lock
    await releaseRunLock(payload, runId, {
      result: runResult,
      storiesChecked,
      draftsCreated,
      errors: errorLogs.length > 0 ? errorLogs.join('\n') : undefined,
      tokensUsed: totalTokensUsed,
      estimatedCost: totalEstimatedCost,
    })

    return {
      success: runResult !== 'Failed',
      runId,
      result: runResult,
      storiesChecked,
      draftsCreated,
      photosAssigned,
      draftIds,
      errors: errorLogs,
      tokensUsed: totalTokensUsed,
      estimatedCost: totalEstimatedCost,
      message: `Automation finished with result "${runResult}". Created ${draftsCreated} draft(s) (${photosAssigned} with photo) from ${storiesChecked} stories evaluated.`,
    }
  } catch (err: any) {
    const fatalMsg = `Unhandled automation failure: ${err.message || String(err)}`
    errorLogs.push(fatalMsg)
    const totalDuration = Date.now() - runStartTime
    console.log(
      `[Claude Automation] Total duration: ${totalDuration}ms (result: Failed, error: ${fatalMsg})`,
    )

    await releaseRunLock(payload, runId, {
      result: 'Failed',
      storiesChecked,
      draftsCreated,
      errors: errorLogs.join('\n'),
      tokensUsed: totalTokensUsed,
      estimatedCost: totalEstimatedCost,
    })

    return {
      success: false,
      runId,
      result: 'Failed',
      storiesChecked,
      draftsCreated,
      photosAssigned,
      draftIds,
      errors: errorLogs,
      tokensUsed: totalTokensUsed,
      estimatedCost: totalEstimatedCost,
      message: fatalMsg,
    }
  }
}

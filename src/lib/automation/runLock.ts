/**
 * Run Lock & Daily Cap Enforcement for Charlie News Automation
 * Uses the Payload automation-runs collection to prevent concurrent runs
 * and enforce the SOW daily limits (max 4 runs / max 8 drafts per day)
 */

import type { Payload } from 'payload'
import { AUTOMATION_CONFIG } from '@/config/automation'

import { getSydneyTime } from '@/lib/automation/timezone'

export function getSydneyStartOfToday(date: Date = new Date()): string {
  return getSydneyTime(date).startOfDayUtc.toISOString()
}

export interface LockAcquisitionResult {
  acquired: boolean
  runId?: string | number
  reason?: string
  dailyRunsToday?: number
  draftsCreatedToday?: number
}

/**
 * Attempts to acquire an exclusive run lock
 */
export async function acquireRunLock(
  payload: Payload,
  options: { force?: boolean } = {},
): Promise<LockAcquisitionResult> {
  const now = new Date()
  const lockTimeoutCutoff = new Date(
    now.getTime() - AUTOMATION_CONFIG.LOCK_TIMEOUT_MINUTES * 60 * 1000,
  ).toISOString()

  // 1. Check for an active, in-progress run
  const activeRuns = await payload.find({
    collection: 'automation-runs',
    where: {
      and: [
        { result: { equals: 'Running' } },
        { startedAt: { greater_than_equal: lockTimeoutCutoff } },
      ],
    },
    limit: 1,
  })

  if (activeRuns.totalDocs > 0) {
    const active = activeRuns.docs[0]
    return {
      acquired: false,
      reason: `Automation run #${active.id} started at ${active.startedAt} is currently active. Simultaneous execution blocked.`,
    }
  }

  // 2. Check daily run cap (max 4 runs/day) unless explicitly forced for manual test
  const startOfToday = getSydneyStartOfToday()
  const runsToday = await payload.find({
    collection: 'automation-runs',
    where: {
      and: [
        { startedAt: { greater_than_equal: startOfToday } },
        { result: { not_equals: 'Skipped' } },
      ],
    },
    limit: 20,
    depth: 0,
  })

  const dailyRunsToday = runsToday.totalDocs || 0
  if (!options.force && dailyRunsToday >= AUTOMATION_CONFIG.MAX_RUNS_PER_DAY) {
    // Record skipped run in database
    await payload.create({
      collection: 'automation-runs',
      data: {
        startedAt: now.toISOString(),
        finishedAt: now.toISOString(),
        result: 'Skipped',
        storiesChecked: 0,
        draftsCreated: 0,
        errors: `Daily run limit of ${AUTOMATION_CONFIG.MAX_RUNS_PER_DAY} runs reached for today (${dailyRunsToday} runs completed).`,
        tokensUsed: 0,
        estimatedCost: 0,
      },
    })

    return {
      acquired: false,
      reason: `Daily maximum of ${AUTOMATION_CONFIG.MAX_RUNS_PER_DAY} runs reached for today (${dailyRunsToday} runs recorded).`,
      dailyRunsToday,
    }
  }

  // 3. Check daily draft creation cap (max 8 drafts/day)
  const draftsToday = await payload.find({
    collection: 'articles',
    where: {
      and: [
        { createdAt: { greater_than_equal: startOfToday } },
        { claudeModel: { exists: true } },
      ],
    },
    limit: 50,
    depth: 0,
  })

  const draftsCreatedToday = draftsToday.totalDocs || 0
  if (!options.force && draftsCreatedToday >= AUTOMATION_CONFIG.MAX_DRAFTS_PER_DAY) {
    await payload.create({
      collection: 'automation-runs',
      data: {
        startedAt: now.toISOString(),
        finishedAt: now.toISOString(),
        result: 'Skipped',
        storiesChecked: 0,
        draftsCreated: 0,
        errors: `Daily draft creation limit of ${AUTOMATION_CONFIG.MAX_DRAFTS_PER_DAY} drafts reached for today (${draftsCreatedToday} drafts created).`,
        tokensUsed: 0,
        estimatedCost: 0,
      },
    })

    return {
      acquired: false,
      reason: `Daily maximum of ${AUTOMATION_CONFIG.MAX_DRAFTS_PER_DAY} drafts reached for today (${draftsCreatedToday} drafts created).`,
      draftsCreatedToday,
    }
  }

  // 4. Create new in-progress run lock record
  const runDoc = await payload.create({
    collection: 'automation-runs',
    data: {
      startedAt: now.toISOString(),
      result: 'Running',
      storiesChecked: 0,
      draftsCreated: 0,
      tokensUsed: 0,
      estimatedCost: 0,
    },
  })

  return {
    acquired: true,
    runId: runDoc.id,
    dailyRunsToday,
    draftsCreatedToday,
  }
}

/**
 * Releases the run lock and finalizes the automation-runs record
 */
export async function releaseRunLock(
  payload: Payload,
  runId: string | number,
  finalData: {
    result: 'Success' | 'Partial' | 'Failed'
    storiesChecked: number
    draftsCreated: number
    errors?: string
    tokensUsed: number
    estimatedCost: number
  },
): Promise<void> {
  try {
    await payload.update({
      collection: 'automation-runs',
      id: runId,
      data: {
        finishedAt: new Date().toISOString(),
        result: finalData.result,
        storiesChecked: finalData.storiesChecked,
        draftsCreated: finalData.draftsCreated,
        errors: finalData.errors || null,
        tokensUsed: finalData.tokensUsed,
        estimatedCost: finalData.estimatedCost,
      },
    })
  } catch (err) {
    console.error(`Failed to update automation run #${runId}:`, err)
  }
}

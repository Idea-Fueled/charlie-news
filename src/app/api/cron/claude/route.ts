/**
 * Protected Vercel Cron & Manual Trigger Endpoint for Claude Automation
 * Path: /api/cron/claude
 *
 * Supported methods: GET, POST
 * Requires authorization header: Authorization: Bearer <CRON_SECRET>
 * or x-cron-secret: <CRON_SECRET> or ?secret=<CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { runClaudeAutomation } from '@/lib/automation/orchestrator'
import { checkSydneySchedule } from '@/lib/automation/timezone'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60s max serverless duration for Vercel

function verifyAuthorization(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.AUTOMATION_SECRET

  // Fail closed if no secret is configured
  if (!secret || secret.trim() === '') {
    return false
  }

  // 1. Check Bearer token (standard Vercel Cron header)
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token === secret) return true
  }

  // 2. Check custom x-cron-secret header
  const customHeader = req.headers.get('x-cron-secret')
  if (customHeader && customHeader.trim() === secret) {
    return true
  }

  // 3. Check query param ?secret=...
  const { searchParams } = new URL(req.url)
  const querySecret = searchParams.get('secret')
  if (querySecret && querySecret.trim() === secret) {
    return true
  }

  return false
}

async function handleAutomation(req: NextRequest) {
  // Security verification
  if (!verifyAuthorization(req)) {
    return NextResponse.json(
      {
        error: 'Unauthorized: Missing or invalid authorization credentials.',
        hint: 'Provide Authorization: Bearer <CRON_SECRET> header or ?secret=<CRON_SECRET> parameter.',
      },
      { status: 401 },
    )
  }

  const { searchParams } = new URL(req.url)
  const force = searchParams.get('force') === 'true'
  const useMock = searchParams.get('mock') === 'true'

  // Server-side Sydney Schedule Validation
  // Vercel Cron fires on the unified UTC hours (19, 20, 23, 0, 3, 4, 7, 8)
  // covering 6 AM, 10 AM, 2 PM, 6 PM Sydney in both AEDT (UTC+11) and AEST (UTC+10).
  // When triggered on off-schedule Sydney hours, skip cleanly without consuming runs.
  if (!force) {
    const scheduleCheck = checkSydneySchedule(new Date())
    if (!scheduleCheck.isScheduled) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          success: true,
          skipped: true,
          result: 'Skipped',
          reason: scheduleCheck.reason,
          sydneyTime: scheduleCheck.formattedSydneyTime,
          message: scheduleCheck.reason,
        },
        { status: 200 },
      )
    }
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const report = await runClaudeAutomation(payload, { force, useMock })

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        ...report,
      },
      { status: report.success ? 200 : 500 },
    )
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `Automation handler exception: ${err.message || String(err)}`,
      },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  return handleAutomation(req)
}

export async function POST(req: NextRequest) {
  return handleAutomation(req)
}

import React from 'react'
import Link from 'next/link'
import type { Payload } from 'payload'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

interface DashboardProps {
  payload?: Payload
  user?: {
    email?: string
    id?: string | number
  } | null
}

// Format time in Australian Sydney timezone
function formatSydneyTime(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d).toLowerCase()
  } catch {
    return String(date)
  }
}

// Format date in Australian Sydney timezone
function formatSydneyDate(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return String(date)
  }
}

// Calculate Sydney start of today and start of current week
function getSydneyDateBoundaries() {
  const now = new Date()
  const sydneyFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
  
  const parts = sydneyFormatter.formatToParts(now)
  const partMap: Record<string, string> = {}
  for (const p of parts) {
    partMap[p.type] = p.value
  }

  // ISO string for Sydney midnight: YYYY-MM-DDT00:00:00+10:00 (or +11:00)
  // Let's compute date relative to UTC
  const sydneyNowStr = now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' })
  const sydneyNow = new Date(sydneyNowStr)
  
  const startOfToday = new Date(sydneyNow)
  startOfToday.setHours(0, 0, 0, 0)

  // Start of week: Monday
  const day = startOfToday.getDay() // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = (day + 6) % 7
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - diffToMonday)

  return { startOfToday, startOfWeek, sydneyDateFormatted: sydneyFormatter.format(now) }
}

export const AdminDashboard = async (props: DashboardProps) => {
  const payload = props.payload || (await getPayload({ config: configPromise }))

  // 1. Fetch Draft articles in the Review Queue
  const draftsData = await payload.find({
    collection: 'articles',
    where: {
      status: { equals: 'Draft' },
    },
    sort: '-createdAt',
    limit: 50,
    pagination: false,
    depth: 1,
  })

  const drafts = draftsData.docs || []
  const reviewQueueCount = drafts.length

  // 2. Count Drafts flagged "Needs photo" or lacking an image
  const needsPhotoCount = drafts.filter((doc: any) => {
    const hasPhotoFlag = Array.isArray(doc.flags) && doc.flags.includes('Needs photo')
    const hasNoImageUrl = !doc.image?.url || doc.image.url.trim() === ''
    return hasPhotoFlag || hasNoImageUrl
  }).length

  // 3. Published Today & This Week
  const { startOfToday, startOfWeek, sydneyDateFormatted } = getSydneyDateBoundaries()

  const publishedData = await payload.find({
    collection: 'articles',
    where: {
      status: { equals: 'Published' },
    },
    limit: 200,
    pagination: false,
    depth: 0,
  })

  let publishedTodayCount = 0
  let publishedThisWeekCount = 0

  for (const doc of publishedData.docs || []) {
    if (doc.publishedAt) {
      // Compare in Sydney local time
      const pubSydneyStr = new Date(doc.publishedAt).toLocaleString('en-US', {
        timeZone: 'Australia/Sydney',
      })
      const pubDate = new Date(pubSydneyStr)
      if (pubDate >= startOfToday) {
        publishedTodayCount++
      }
      if (pubDate >= startOfWeek) {
        publishedThisWeekCount++
      }
    }
  }

  // 4. Last Claude Run status from Automation Runs collection
  const lastRunData = await payload.find({
    collection: 'automation-runs',
    sort: '-startedAt',
    limit: 1,
    depth: 0,
  })

  const lastRun = lastRunData.docs?.[0] || null

  // 5. Total Published Articles Count
  const totalPublishedCount = publishedData.docs?.length || 0

  return (
    <div className="charlie-admin-dashboard">
      {/* Header Banner */}
      <div className="charlie-dash-header">
        <div className="charlie-dash-header-title">
          <div className="charlie-dash-badge">EDITORIAL DASHBOARD</div>
          <h1>Charlie News Desk</h1>
          <p className="charlie-dash-subtitle">
            Sydney, Australia • {sydneyDateFormatted} • Logged in as Single Administrator
          </p>
        </div>
        <div className="charlie-dash-header-actions">
          <Link
            href="/admin/collections/articles?where[status][equals]=Draft"
            className="charlie-btn charlie-btn--primary"
          >
            Go to Review Queue →
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="charlie-btn charlie-btn--secondary"
          >
            Live Website ↗
          </a>
        </div>
      </div>

      {/* Primary KPI Grid (4 Metrics required by SOW) */}
      <div className="charlie-kpi-grid">
        {/* KPI 1: Review Queue Count */}
        <div className="charlie-kpi-card charlie-kpi-card--primary">
          <div className="charlie-kpi-top">
            <span className="charlie-kpi-label">Review Queue</span>
            <span className="charlie-kpi-tag charlie-kpi-tag--draft">Waiting</span>
          </div>
          <div className="charlie-kpi-number">{reviewQueueCount}</div>
          <div className="charlie-kpi-desc">Draft articles awaiting editorial sign-off</div>
          <div className="charlie-kpi-action">
            <Link
              href="/admin/collections/articles?where[status][equals]=Draft"
              className="charlie-kpi-link"
            >
              Go to Review Queue →
            </Link>
          </div>
        </div>

        {/* KPI 2: Needs Photo Count */}
        <div className="charlie-kpi-card">
          <div className="charlie-kpi-top">
            <span className="charlie-kpi-label">Needs Photo</span>
            <span
              className={`charlie-kpi-tag ${
                needsPhotoCount > 0 ? 'charlie-kpi-tag--warning' : 'charlie-kpi-tag--success'
              }`}
            >
              {needsPhotoCount > 0 ? 'Action Needed' : 'Clear'}
            </span>
          </div>
          <div className="charlie-kpi-number">{needsPhotoCount}</div>
          <div className="charlie-kpi-desc">
            Drafts requiring image selection before approval
          </div>
          <div className="charlie-kpi-action">
            <Link
              href="/admin/collections/articles?where[status][equals]=Draft"
              className="charlie-kpi-link charlie-kpi-link--subtle"
            >
              Filter in Queue →
            </Link>
          </div>
        </div>

        {/* KPI 3: Published Today */}
        <div className="charlie-kpi-card">
          <div className="charlie-kpi-top">
            <span className="charlie-kpi-label">Published Today</span>
            <span className="charlie-kpi-tag charlie-kpi-tag--neutral">Sydney Time</span>
          </div>
          <div className="charlie-kpi-number">{publishedTodayCount}</div>
          <div className="charlie-kpi-desc">Articles published since midnight Sydney</div>
          <div className="charlie-kpi-action">
            <Link
              href="/admin/collections/articles?where[status][equals]=Published"
              className="charlie-kpi-link charlie-kpi-link--subtle"
            >
              View Live ({totalPublishedCount} total) →
            </Link>
          </div>
        </div>

        {/* KPI 4: Published This Week */}
        <div className="charlie-kpi-card">
          <div className="charlie-kpi-top">
            <span className="charlie-kpi-label">Published This Week</span>
            <span className="charlie-kpi-tag charlie-kpi-tag--neutral">Mon – Sun</span>
          </div>
          <div className="charlie-kpi-number">{publishedThisWeekCount}</div>
          <div className="charlie-kpi-desc">Weekly editorial publishing cadence</div>
          <div className="charlie-kpi-action">
            <Link
              href="/admin/collections/articles?where[status][equals]=Published"
              className="charlie-kpi-link charlie-kpi-link--subtle"
            >
              Published Articles →
            </Link>
          </div>
        </div>
      </div>

      {/* KPI 5: Last Claude Run Status Section (SOW Requirement 5) */}
      <div className="charlie-automation-card">
        <div className="charlie-automation-header">
          <div className="charlie-automation-title">
            <div className="charlie-automation-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="M2 12h4" />
                <path d="m4.93 19.07 2.83-2.83" />
                <path d="M12 22v-4" />
                <path d="m19.07 19.07-2.83-2.83" />
                <path d="M22 12h-4" />
                <path d="m19.07 4.93-2.83 2.83" />
              </svg>
            </div>
            <div>
              <h3>Claude Automation Pipeline</h3>
              <p>Automated news intake, drafting & editorial checking</p>
            </div>
          </div>

          <div className="charlie-automation-badge-area">
            {lastRun ? (
              <span
                className={`charlie-status-pill charlie-status-pill--${(
                  lastRun.result || 'partial'
                ).toLowerCase()}`}
              >
                ● {lastRun.result}
              </span>
            ) : (
              <span className="charlie-status-pill charlie-status-pill--neutral">
                ● Ready
              </span>
            )}
            <Link
              href="/admin/collections/automation-runs"
              className="charlie-btn charlie-btn--secondary"
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              All Runs →
            </Link>
          </div>
        </div>

        <div className="charlie-automation-body">
          {lastRun ? (
            <>
              {/* SOW Example Display text: "Last run: 10:00 am, 2 drafts created" or "Last run failed, see details" */}
              <div className="charlie-automation-headline">
                {lastRun.result === 'Failed' ? (
                  <span className="charlie-text-failed">
                    Last run failed •{' '}
                    <Link
                      href={`/admin/collections/automation-runs/${lastRun.id}`}
                      className="charlie-inline-link"
                    >
                      see details
                    </Link>
                  </span>
                ) : (
                  <span>
                    Last run: <strong>{formatSydneyTime(lastRun.startedAt)}</strong> ({formatSydneyDate(lastRun.startedAt)}),{' '}
                    <strong>{lastRun.draftsCreated ?? 0} drafts created</strong>
                  </span>
                )}
              </div>

              {/* Automation Run Metrics Bar */}
              <div className="charlie-automation-metrics">
                <div className="charlie-auto-metric-item">
                  <span className="charlie-auto-label">Stories Checked</span>
                  <span className="charlie-auto-val">{lastRun.storiesChecked ?? 0}</span>
                </div>
                <div className="charlie-auto-metric-item">
                  <span className="charlie-auto-label">Drafts Generated</span>
                  <span className="charlie-auto-val">{lastRun.draftsCreated ?? 0}</span>
                </div>
                <div className="charlie-auto-metric-item">
                  <span className="charlie-auto-label">Tokens Used</span>
                  <span className="charlie-auto-val">
                    {lastRun.tokensUsed ? Number(lastRun.tokensUsed).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="charlie-auto-metric-item">
                  <span className="charlie-auto-label">Estimated Cost</span>
                  <span className="charlie-auto-val">
                    ${Number(lastRun.estimatedCost || 0).toFixed(4)}
                  </span>
                </div>
              </div>

              {lastRun.errors && (
                <div className="charlie-automation-error-callout">
                  <strong>Run Note:</strong> {lastRun.errors}
                </div>
              )}
            </>
          ) : (
            <div className="charlie-automation-empty">
              <p>No automation runs recorded yet. Automation runs will record Claude ingest history and draft generation stats here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Review Queue Preview Table / Section */}
      <div className="charlie-preview-section">
        <div className="charlie-preview-header">
          <div>
            <h2>Review Queue — Pending Drafts</h2>
            <p>Newest drafts waiting for single-admin review, approval, or rejection</p>
          </div>
          <Link
            href="/admin/collections/articles?where[status][equals]=Draft"
            className="charlie-btn charlie-btn--secondary"
          >
            View All ({reviewQueueCount}) →
          </Link>
        </div>

        {drafts.length > 0 ? (
          <div className="charlie-table-card">
            <div className="charlie-table-container">
              <table className="charlie-admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Photo</th>
                    <th>Headline</th>
                    <th>Section</th>
                    <th>Flags</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.slice(0, 6).map((draft: any) => {
                    const sectionTitle =
                      typeof draft.section === 'object' && draft.section?.name
                        ? draft.section.name
                        : 'Unassigned'
                    const hasNeedsPhoto =
                      Array.isArray(draft.flags) && draft.flags.includes('Needs photo')
                    const hasNoImage = !draft.image?.url

                    return (
                      <tr key={draft.id}>
                        {/* Thumbnail */}
                        <td>
                          {draft.image?.url ? (
                            <img
                              src={draft.image.url}
                              alt={draft.headline}
                              className="charlie-draft-thumb"
                            />
                          ) : (
                            <div className="charlie-draft-thumb-placeholder">
                              No photo
                            </div>
                          )}
                        </td>

                        {/* Headline */}
                        <td>
                          <Link
                            href={`/admin/collections/articles/${draft.id}`}
                            className="charlie-draft-headline"
                          >
                            {draft.headline}
                          </Link>
                          {draft.summary && (
                            <div className="charlie-draft-summary">{draft.summary}</div>
                          )}
                        </td>

                        {/* Section */}
                        <td>
                          <span className="charlie-section-chip">{sectionTitle}</span>
                        </td>

                        {/* Flags */}
                        <td>
                          <div className="charlie-flags-container">
                            {hasNeedsPhoto || hasNoImage ? (
                              <span className="charlie-flag-badge charlie-flag-badge--photo">
                                Needs photo
                              </span>
                            ) : null}
                            {Array.isArray(draft.flags) &&
                              draft.flags
                                .filter((f: string) => f !== 'Needs photo')
                                .map((f: string) => (
                                  <span key={f} className="charlie-flag-badge">
                                    {f}
                                  </span>
                                ))}
                            {(!draft.flags || draft.flags.length === 0) && !hasNoImage && (
                              <span className="charlie-flag-none">None</span>
                            )}
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="charlie-date-cell">
                          {formatSydneyDate(draft.createdAt)}
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            href={`/admin/collections/articles/${draft.id}`}
                            className="charlie-btn charlie-btn--sm"
                          >
                            Review Draft →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="charlie-empty-state">
            <div className="charlie-empty-icon">✓</div>
            <h3>Review Queue is Clear</h3>
            <p>There are no drafts waiting for review. New articles created by Claude will appear here.</p>
            <div className="charlie-empty-actions">
              <Link
                href="/admin/collections/articles/create"
                className="charlie-btn charlie-btn--primary"
              >
                + Create New Article
              </Link>
              <Link
                href="/admin/collections/articles?where[status][equals]=Published"
                className="charlie-btn charlie-btn--secondary"
              >
                View Published Articles
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Editorial Quick Actions Footer */}
      <div className="charlie-quick-shortcuts">
        <div className="charlie-shortcut-card">
          <h4>Manage Sections</h4>
          <p>Configure property topic guides, slugs, and menu orders.</p>
          <Link href="/admin/collections/sections" className="charlie-shortcut-link">
            Open Sections →
          </Link>
        </div>

        <div className="charlie-shortcut-card">
          <h4>Privacy Policy & Terms</h4>
          <p>Edit publication legal disclosures and user terms.</p>
          <Link href="/admin/collections/pages" className="charlie-shortcut-link">
            Open Privacy & Terms →
          </Link>
        </div>

        <div className="charlie-shortcut-card">
          <h4>Single Admin Account</h4>
          <p>Update administrator credentials, email, and password.</p>
          <Link href="/admin/account" className="charlie-shortcut-link">
            Manage Admin Account →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

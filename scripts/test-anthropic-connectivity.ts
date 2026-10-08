/**
 * Live Anthropic API Connectivity Verification
 * Validates real API connectivity with the client-provided key
 * using the existing Charlie News Claude integration.
 *
 * SAFETY GUARANTEES:
 * - Does NOT create any database articles in Payload.
 * - Does NOT print or expose the API key or secret values.
 * - Uses exact existing integration in src/lib/automation/claude.ts.
 */

import 'dotenv/config'
import { generateArticleWithClaude, SectionMetadata } from '../src/lib/automation/claude'
import { RawRssStory } from '../src/lib/automation/rss'
import { AUTOMATION_CONFIG } from '../src/config/automation'

async function runConnectivityTest() {
  console.log('================================================================')
  console.log('CHARLIE NEWS - ANTHROPIC CLAUDE REAL CONNECTIVITY TEST')
  console.log('================================================================\n')

  // 1. Verify key is loaded from server-side environment
  const rawKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!rawKey) {
    console.error('✗ FAILED: ANTHROPIC_API_KEY is not set in process.env.')
    process.exit(1)
  }

  // Verify key format safely without printing actual key
  const maskedKey = `${rawKey.slice(0, 10)}...${rawKey.slice(-4)}`
  console.log(`✓ ANTHROPIC_API_KEY detected in environment (format: ${maskedKey})`)

  if (!rawKey.startsWith('sk-ant-')) {
    console.error('✗ FAILED: ANTHROPIC_API_KEY does not start with standard "sk-ant-" prefix.')
    process.exit(1)
  }
  console.log('✓ API Key prefix validation passed')

  // 2. Model configuration check
  const configuredModel = process.env.CLAUDE_MODEL || AUTOMATION_CONFIG.DEFAULT_MODEL
  console.log(`✓ Configured model: ${configuredModel}`)

  // 3. Test story input for minimal safe verification
  const testStory: RawRssStory = {
    title: 'Sydney Suburbs Lead National Spring Renovation Approvals',
    link: 'https://example.com.au/property/sydney-renovation-approvals-test',
    guid: 'https://example.com.au/property/sydney-renovation-approvals-test',
    pubDate: new Date().toUTCString(),
    contentSnippet:
      'Australian Bureau of Statistics data shows residential alterations and additions approvals in Greater Sydney rose 4.2 percent over the past quarter, driven by inner-west and northern beaches homeowners updating existing dwellings rather than relocating in a higher-rate environment.',
    sourceName: 'Australian Property Wire (Test Feed)',
  }

  const testSections: SectionMetadata[] = [
    {
      id: 1,
      name: 'Renovation',
      slug: 'renovation',
      claudeTopicGuide: 'Home renovations, extensions, council DA approvals, architectural design.',
    },
    {
      id: 2,
      name: 'Property',
      slug: 'property',
      claudeTopicGuide: 'Housing market prices, auction clearance rates, interest rates.',
    },
  ]

  console.log('\n--- Sending live test request to Anthropic API via existing claude.ts ---')
  console.log(`Model: ${configuredModel}`)
  console.log('Awaiting response from Anthropic API (max 60s timeout)...')

  const startTime = Date.now()

  // Execute using existing integration with live credentials (useMock: false)
  const result = await generateArticleWithClaude(testStory, testSections, {
    useMock: false,
    apiKey: rawKey,
    model: configuredModel,
  })

  const durationMs = Date.now() - startTime

  if (!result.success || !result.data) {
    console.error(`\n✗ FAILED: Anthropic API returned error: ${result.error}`)
    process.exit(1)
  }

  const data = result.data

  console.log(`\n✓ Anthropic API connectivity SUCCESSFUL in ${(durationMs / 1000).toFixed(2)}s!`)
  console.log('----------------------------------------------------------------')
  console.log(`  Model Used:         ${data.model}`)
  console.log(`  Headline:           "${data.headline}" (length: ${data.headline.length} chars)`)
  console.log(`  Summary:            "${data.summary}" (length: ${data.summary.length} chars)`)
  console.log(`  SEO Description:    "${data.seoDescription}" (length: ${data.seoDescription.length} chars)`)
  console.log(`  Section Mapped:     "${data.sectionSlug}"`)
  console.log(`  Sections Generated: ${data.sections.length} subheadings/blocks`)
  console.log(`  Photo Search Words: "${data.photoSearchWords}"`)
  console.log(`  Image Alt:          "${data.imageAlt}"`)
  console.log(`  AI Disclosure:      "${data.aiNote}"`)
  console.log(`  Input Tokens:       ${data.inputTokens}`)
  console.log(`  Output Tokens:      ${data.outputTokens}`)
  console.log(`  Total Tokens:       ${data.tokensUsed}`)
  console.log(`  Estimated Cost:     $${data.estimatedCost.toFixed(5)} USD`)
  console.log('----------------------------------------------------------------')
  console.log('✓ Response structure parsed and validated completely by existing integration')
  console.log('✓ Zero production articles created (dry-run connectivity test only)')
  console.log('\n================================================================')
  console.log('ALL ANTHROPIC CONNECTIVITY CHECKS PASSED!')
  console.log('================================================================\n')
}

runConnectivityTest().catch((err) => {
  console.error('Fatal connectivity test error:', err.message || err)
  process.exit(1)
})

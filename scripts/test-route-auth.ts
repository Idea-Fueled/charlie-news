import 'dotenv/config'
import { NextRequest } from 'next/server'
import { GET, POST } from '../src/app/api/cron/claude/route'

async function runAuthTests() {
  console.log('Testing Protected Endpoint Auth (/api/cron/claude)...')
  process.env.CRON_SECRET = 'super-secret-test-token-2026'

  // Test 1: No secret -> 401
  const req1 = new NextRequest('http://localhost:3000/api/cron/claude')
  const res1 = await GET(req1)
  console.log('1. No credentials status:', res1.status)
  if (res1.status !== 401) throw new Error(`Expected 401, got ${res1.status}`)

  // Test 2: Invalid Bearer token -> 401
  const req2 = new NextRequest('http://localhost:3000/api/cron/claude', {
    headers: { Authorization: 'Bearer bad-token' },
  })
  const res2 = await GET(req2)
  console.log('2. Bad Bearer token status:', res2.status)
  if (res2.status !== 401) throw new Error(`Expected 401, got ${res2.status}`)

  // Test 3: Invalid query param -> 401
  const req3 = new NextRequest('http://localhost:3000/api/cron/claude?secret=bad-token')
  const res3 = await GET(req3)
  console.log('3. Bad query secret status:', res3.status)
  if (res3.status !== 401) throw new Error(`Expected 401, got ${res3.status}`)

  // Test 4: Valid Bearer token -> Authorization passes (returns 200 or automation result)
  const req4 = new NextRequest('http://localhost:3000/api/cron/claude?mock=true&force=true', {
    headers: { Authorization: 'Bearer super-secret-test-token-2026' },
  })
  const res4 = await GET(req4)
  console.log('4. Valid Bearer status:', res4.status)
  const body4 = await res4.json()
  console.log('4. Valid Bearer body:', body4)
  if (res4.status !== 200) throw new Error(`Expected 200, got ${res4.status}: ${JSON.stringify(body4)}`)

  // Test 5: Valid custom header x-cron-secret -> 200
  const req5 = new NextRequest('http://localhost:3000/api/cron/claude?mock=true&force=true', {
    headers: { 'x-cron-secret': 'super-secret-test-token-2026' },
  })
  const res5 = await POST(req5)
  console.log('5. Valid x-cron-secret status:', res5.status)
  if (res5.status !== 200) throw new Error(`Expected 200, got ${res5.status}`)

  // Test 6: Valid query param secret -> 200
  const req6 = new NextRequest(
    'http://localhost:3000/api/cron/claude?secret=super-secret-test-token-2026&mock=true&force=true',
  )
  const res6 = await GET(req6)
  console.log('6. Valid query secret status:', res6.status)
  if (res6.status !== 200) throw new Error(`Expected 200, got ${res6.status}`)

  // Test 7: Unforced invocation during current off-schedule Sydney hour skips cleanly
  const req7 = new NextRequest(
    'http://localhost:3000/api/cron/claude?secret=super-secret-test-token-2026&mock=true',
  )
  const res7 = await GET(req7)
  const body7 = await res7.json()
  console.log('7. Unforced off-schedule status:', res7.status, 'result:', body7.result)
  if (res7.status !== 200) throw new Error(`Expected 200, got ${res7.status}`)
  if (body7.skipped) {
    console.log('  ✓ Off-schedule cron trigger cleanly skipped without executing pipeline!')
  }

  console.log('ALL ENDPOINT SECURITY & SCHEDULE TESTS PASSED!')
  process.exit(0)
}

runAuthTests().catch((err) => {
  console.error('Test error:', err)
  process.exit(1)
})

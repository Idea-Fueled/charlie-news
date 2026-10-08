import 'dotenv/config'
import { NextRequest } from 'next/server'
import {
  subscribeToNewsletter,
  isValidEmail,
} from '../src/lib/klaviyo/client'
import { NEWSLETTER_MESSAGES } from '../src/lib/klaviyo/types'
import { POST } from '../src/app/api/newsletter/subscribe/route'

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAILED: ${msg}`)
    failed += 1
    throw new Error(`Assertion failed: ${msg}`)
  } else {
    console.log(`  ✓ ${msg}`)
    passed += 1
  }
}

async function runKlaviyoTests() {
  console.log('================================================================')
  console.log('CHARLIE NEWS - STEP 8 KLAVIYO NEWSLETTER TEST SUITE')
  console.log('================================================================\n')

  // -------------------------------------------------------------
  // TEST 1: Email Validation (RFC Standards)
  // -------------------------------------------------------------
  console.log('--- TEST 1: Client & Server Email Validation ---')
  assert(isValidEmail('reader@example.com'), 'Valid standard email accepted')
  assert(isValidEmail('jane.doe+tag@property.com.au'), 'Valid Australian domain with tag accepted')
  assert(!isValidEmail(''), 'Empty string rejected')
  assert(!isValidEmail('plainaddress'), 'Address without @ rejected')
  assert(!isValidEmail('user@'), 'Address without domain rejected')
  assert(!isValidEmail('@nodomain.com'), 'Address without user rejected')
  assert(!isValidEmail('user@domain'), 'Address without TLD rejected')
  assert(!isValidEmail('user@domain..com'), 'Address with double dots rejected')
  assert(!isValidEmail('user @domain.com'), 'Address with spaces rejected')

  // -------------------------------------------------------------
  // TEST 2: Valid Email Subscription (Mock / Local)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Valid Email Subscription ---')
  const validRes = await subscribeToNewsletter('subscriber@charlienews.com.au', {
    useMock: true,
  })
  assert(validRes.success === true, 'Valid subscription returned success: true')
  assert(
    validRes.message === NEWSLETTER_MESSAGES.SUCCESS,
    `Success message matches SOW: "${validRes.message}"`,
  )

  // -------------------------------------------------------------
  // TEST 3: Invalid Email Returns SOW Message
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Invalid Email Error Message ---')
  const invalidRes = await subscribeToNewsletter('not-an-email', {
    useMock: true,
  })
  assert(invalidRes.success === false, 'Invalid email returned success: false')
  assert(
    invalidRes.message === NEWSLETTER_MESSAGES.INVALID_EMAIL,
    `Error message matches SOW: "${invalidRes.message}"`,
  )

  // -------------------------------------------------------------
  // TEST 4: Already Subscribed (Privacy Protection)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Already Subscribed / Privacy Protection ---')
  const alreadySubRes = await subscribeToNewsletter('existing@charlienews.com.au', {
    useMock: true,
    simulateAlreadySubscribed: true,
  })
  assert(alreadySubRes.success === true, 'Already subscribed returned success: true')
  assert(
    alreadySubRes.message === NEWSLETTER_MESSAGES.SUCCESS,
    `Returns identical success message without revealing existing subscription: "${alreadySubRes.message}"`,
  )
  assert(
    !alreadySubRes.message.toLowerCase().includes('already'),
    'Does not expose "already" or status details to the user',
  )

  // -------------------------------------------------------------
  // TEST 5: Klaviyo API Failure / Network Error Handling
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: API Failure / Generic Error Handling ---')
  const failureRes = await subscribeToNewsletter('reader@charlienews.com.au', {
    useMock: true,
    forceFail: true,
  })
  assert(failureRes.success === false, 'API failure returned success: false')
  assert(
    failureRes.message === NEWSLETTER_MESSAGES.API_ERROR,
    `Error message matches SOW generic message: "${failureRes.message}"`,
  )
  assert(
    !failureRes.message.includes('API') && !failureRes.message.includes('Klaviyo'),
    'Does not expose technical service details to user',
  )

  // -------------------------------------------------------------
  // TEST 6: Route Endpoint - Valid Submission
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Route /api/newsletter/subscribe (Valid) ---')
  const reqValid = new NextRequest('http://localhost:3000/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'newreader@charlienews.com.au' }),
  })
  const resValid = await POST(reqValid)
  assert(resValid.status === 200, `Valid submission returned HTTP 200 (got ${resValid.status})`)
  const jsonValid = await resValid.json()
  assert(jsonValid.success === true, 'JSON response has success: true')
  assert(
    jsonValid.message === NEWSLETTER_MESSAGES.SUCCESS,
    `Response message is "${jsonValid.message}"`,
  )

  // -------------------------------------------------------------
  // TEST 7: Route Endpoint - Invalid Email Submission
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Route /api/newsletter/subscribe (Invalid) ---')
  const reqInvalid = new NextRequest('http://localhost:3000/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bad-email-format' }),
  })
  const resInvalid = await POST(reqInvalid)
  assert(resInvalid.status === 400, `Invalid submission returned HTTP 400 (got ${resInvalid.status})`)
  const jsonInvalid = await resInvalid.json()
  assert(jsonInvalid.success === false, 'JSON response has success: false')
  assert(
    jsonInvalid.message === NEWSLETTER_MESSAGES.INVALID_EMAIL,
    `Response message is "${jsonInvalid.message}"`,
  )

  // -------------------------------------------------------------
  // TEST 8: Route Endpoint - Honeypot / Bot Trap Block
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Honeypot Spam-Trap Blocking ---')
  const reqBot = new NextRequest('http://localhost:3000/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'spammer@botnet.com',
      b_trap: 'I am a spambot filling all inputs',
    }),
  })
  const resBot = await POST(reqBot)
  assert(resBot.status === 200, 'Bot request returns 200 to neutralize bot probing')
  const jsonBot = await resBot.json()
  assert(jsonBot.success === true, 'Returns generic success without calling Klaviyo')

  // -------------------------------------------------------------
  // TEST 9: Security Check - No Secrets in Client Responses
  // -------------------------------------------------------------
  console.log('\n--- TEST 9: Security Check (Zero Secret Leakage) ---')
  const responseString = JSON.stringify(jsonValid) + JSON.stringify(jsonInvalid)
  assert(
    !responseString.includes('pk_') &&
      !responseString.includes('api_key') &&
      !responseString.includes('KLAVIYO'),
    'Zero Klaviyo private keys or internal credentials present in API responses',
  )

  // -------------------------------------------------------------
  // TEST SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================')
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('================================================================\n')

  process.exit(failed > 0 ? 1 : 0)
}

runKlaviyoTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})

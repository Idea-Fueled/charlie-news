/**
 * Newsletter Subscription API Endpoint
 * Path: /api/newsletter/subscribe
 * Method: POST
 *
 * Implements SOW Requirements:
 * - Server-side validation
 * - Spam-trap (honeypot) bot blocking
 * - Klaviyo server-side list subscription
 * - Safe user status responses (Success, Invalid Email, Already Subscribed, Error)
 * - Zero secret or private API key leakage to browser
 */

import { NextRequest, NextResponse } from 'next/server'
import { subscribeToNewsletter, isValidEmail } from '@/lib/klaviyo/client'
import { NEWSLETTER_MESSAGES } from '@/lib/klaviyo/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    let email = ''
    let honeypot = ''

    // Parse incoming request body (support JSON and FormData)
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      email = String(body?.email || '').trim()
      honeypot = String(body?.trap || body?.trap_field || body?.b_trap || '').trim()
    } else {
      const formData = await req.formData().catch(() => new FormData())
      email = String(formData.get('email') || '').trim()
      honeypot = String(
        formData.get('trap') ||
          formData.get('trap_field') ||
          formData.get('b_trap') ||
          '',
      ).trim()
    }

    // 1. Honeypot check (Spam-trap for simple bots)
    if (honeypot) {
      console.warn('[Newsletter] Bot trapped by honeypot field. Silently blocked.')
      // Silently return success to fool bots without making external API calls
      return NextResponse.json({
        success: true,
        message: NEWSLETTER_MESSAGES.SUCCESS,
      })
    }

    // 2. Server-side email validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: NEWSLETTER_MESSAGES.INVALID_EMAIL,
        },
        { status: 400 },
      )
    }

    // 3. Subscribe to Klaviyo list
    const result = await subscribeToNewsletter(email)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: result.message,
      },
      { status: 500 },
    )
  } catch (err: any) {
    console.error('[Newsletter Endpoint Error]', err?.message || String(err))
    return NextResponse.json(
      {
        success: false,
        message: NEWSLETTER_MESSAGES.API_ERROR,
      },
      { status: 500 },
    )
  }
}

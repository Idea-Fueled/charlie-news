/**
 * Server-Side Klaviyo API Client for Charlie News Newsletter
 * Implements SOW Requirement: Subscribe profile to client's Klaviyo list
 * using the official Klaviyo JSON:API revision 2024.
 *
 * Security: Private API key is strictly server-side and never exposed to the client.
 */

import {
  NewsletterSubscribeResult,
  NEWSLETTER_MESSAGES,
  SubscribeOptions,
  KlaviyoErrorType,
} from './types'

const KLAVIYO_API_URL =
  'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/'
const KLAVIYO_API_REVISION = '2024-06-15'

/**
 * Validates email format according to RFC standards for web forms.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const trimmed = email.trim()
  if (trimmed.length > 254) return false
  // Standard RFC 5322 compliant regex for practical web forms
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  return emailRegex.test(trimmed)
}

/**
 * Subscribes a user's email to the configured Klaviyo newsletter list.
 */
export async function subscribeToNewsletter(
  rawEmail: string,
  options: SubscribeOptions = {},
): Promise<NewsletterSubscribeResult> {
  // 1. Server-side validation
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      success: false,
      message: NEWSLETTER_MESSAGES.INVALID_EMAIL,
    }
  }

  const normalizedEmail = rawEmail.trim().toLowerCase()

  if (!isValidEmail(normalizedEmail)) {
    return {
      success: false,
      message: NEWSLETTER_MESSAGES.INVALID_EMAIL,
    }
  }

  // 2. Safe Mock / Test Adapter
  const isMockEnv =
    options.useMock ||
    process.env.USE_MOCK_KLAVIYO === 'true' ||
    process.env.NODE_ENV === 'test'

  if (isMockEnv) {
    if (options.forceFail) {
      console.warn('[Klaviyo Mock] Simulating Klaviyo API failure.')
      return {
        success: false,
        message: NEWSLETTER_MESSAGES.API_ERROR,
        isMock: true,
      }
    }

    if (options.simulateAlreadySubscribed) {
      // SOW Privacy Rule: return standard success message
      return {
        success: true,
        message: NEWSLETTER_MESSAGES.ALREADY_SUBSCRIBED,
        isMock: true,
      }
    }

    return {
      success: true,
      message: NEWSLETTER_MESSAGES.SUCCESS,
      isMock: true,
    }
  }

  // 3. Verify Live Environment Variables
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY?.trim()
  const listId = process.env.KLAVIYO_LIST_ID?.trim()

  if (!apiKey || !listId) {
    console.error(
      `[Klaviyo Configuration Error] Missing credentials. Private API Key configured: ${Boolean(apiKey)}, List ID configured: ${Boolean(listId)}`,
    )
    // Fallback in dev/preview if client credentials are not yet supplied
    if (process.env.NODE_ENV !== 'production') {
      return {
        success: true,
        message: NEWSLETTER_MESSAGES.SUCCESS,
        isMock: true,
      }
    }
    return {
      success: false,
      message: NEWSLETTER_MESSAGES.API_ERROR,
      errorType: 'CONFIG_ERROR',
      errorDetail: 'Missing KLAVIYO_PRIVATE_API_KEY or KLAVIYO_LIST_ID',
    }
  }

  // 4. Official Klaviyo API Call (Bulk Profile Subscription)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15s timeout

    const payload = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'Charlie News Website Footer',
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: normalizedEmail,
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED',
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: listId,
            },
          },
        },
      },
    }

    const response = await fetch(KLAVIYO_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: KLAVIYO_API_REVISION,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
        'User-Agent': 'CharlieNews/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    // Klaviyo returns 202 Accepted for bulk subscription jobs, or 200/201
    if (response.ok || response.status === 202) {
      return {
        success: true,
        message: NEWSLETTER_MESSAGES.SUCCESS,
      }
    }

    // Inspect error response safely
    const errorJson = await response.json().catch(() => null)
    const errors = Array.isArray(errorJson?.errors) ? errorJson.errors : []
    const firstError = errors[0]

    // Check if error indicates profile already subscribed or list relationship exists
    const errorDetail = (firstError?.detail || '').toLowerCase()
    const errorCode = (firstError?.code || '').toLowerCase()

    if (
      errorCode.includes('duplicate') ||
      errorDetail.includes('already') ||
      errorDetail.includes('subscribed') ||
      errorDetail.includes('exists')
    ) {
      // SOW Privacy Rule: Never reveal whether email is already subscribed
      return {
        success: true,
        message: NEWSLETTER_MESSAGES.ALREADY_SUBSCRIBED,
      }
    }

    // Categorize error type safely without leaking private keys or tokens
    let errorType: KlaviyoErrorType = 'SERVER_ERROR'
    let errorCategory = 'Server Error'

    if (response.status === 401) {
      errorType = 'AUTH'
      errorCategory = 'Authentication Failure (Invalid or revoked Private API Key)'
    } else if (response.status === 403) {
      errorType = 'PERMISSION'
      errorCategory = 'Permission Denied (Private API Key is missing required scopes: lists:write)'
    } else if (response.status === 404) {
      errorType = 'INVALID_LIST'
      errorCategory = `Resource Not Found (List ID "${listId}" does not exist in Klaviyo account)`
    } else if (response.status === 400) {
      errorType = 'VALIDATION'
      errorCategory = 'Validation Error (Invalid request schema or malformed identifier)'
    } else if (response.status === 429) {
      errorType = 'RATE_LIMIT'
      errorCategory = 'Rate Limit Exceeded (Too many requests to Klaviyo)'
    } else if (response.status >= 500) {
      errorType = 'SERVER_ERROR'
      errorCategory = `Klaviyo Upstream Server Outage (HTTP ${response.status})`
    }

    // Log error securely server-side without revealing secrets or private key
    console.error(
      `[Klaviyo API Error - ${errorCategory}] HTTP ${response.status}: ${firstError?.title || response.statusText} | Code: ${errorCode || 'none'} | Detail: ${firstError?.detail || 'No detail'}`,
    )

    return {
      success: false,
      message: NEWSLETTER_MESSAGES.API_ERROR,
      errorType,
      errorDetail: firstError?.detail || firstError?.title || response.statusText,
    }
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError'
    const errorMsg = isTimeout ? 'Request timed out after 15s' : err.message || String(err)
    console.error(`[Klaviyo Network Error] ${errorMsg}`)

    return {
      success: false,
      message: NEWSLETTER_MESSAGES.API_ERROR,
      errorType: 'NETWORK_ERROR',
      errorDetail: errorMsg,
    }
  }
}

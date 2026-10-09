/**
 * Server-Side Klaviyo API Client for Charlie News Newsletter
 *
 * Implements Option B:
 * 1. Synchronously create or identify the profile (POST /api/profiles/)
 * 2. Synchronously attach the profile to the newsletter list (POST /api/lists/{id}/relationships/profiles/) -> verified via HTTP 204
 * 3. Submit marketing consent (POST /api/profile-subscription-bulk-create-jobs/) -> verified via HTTP 202
 *
 * Security: Private API key is strictly server-side and never exposed to the client.
 * Compliance: Never treats list membership alone as consent; respects suppression and double opt-in.
 */

import {
  NewsletterSubscribeResult,
  NEWSLETTER_MESSAGES,
  SubscribeOptions,
  KlaviyoErrorType,
} from './types'

const KLAVIYO_BASE_URL = 'https://a.klaviyo.com/api'
const KLAVIYO_API_REVISION = '2024-06-15'

// In-memory cache for list opt-in process setting (10 minute TTL)
let cachedOptInProcess: {
  listId: string
  value: 'single_opt_in' | 'double_opt_in'
  timestamp: number
} | null = null
const OPT_IN_CACHE_TTL = 10 * 60 * 1000

export function clearOptInCache(): void {
  cachedOptInProcess = null
}

/**
 * Validates email format according to RFC standards for web forms.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const trimmed = email.trim()
  if (trimmed.length > 254) return false
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  return emailRegex.test(trimmed)
}

/**
 * Fetches the configured list's opt-in process setting (single vs double opt-in).
 */
export async function getListOptInProcess(
  apiKey: string,
  listId: string,
): Promise<'single_opt_in' | 'double_opt_in'> {
  const now = Date.now()
  if (
    cachedOptInProcess &&
    cachedOptInProcess.listId === listId &&
    now - cachedOptInProcess.timestamp < OPT_IN_CACHE_TTL
  ) {
    return cachedOptInProcess.value
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(`${KLAVIYO_BASE_URL}/lists/${listId}/`, {
      method: 'GET',
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: KLAVIYO_API_REVISION,
        Accept: 'application/vnd.api+json',
        'User-Agent': 'CharlieNews/1.0',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (res.ok) {
      const json = await res.json().catch(() => null)
      const optIn: 'single_opt_in' | 'double_opt_in' =
        json?.data?.attributes?.opt_in_process === 'double_opt_in'
          ? 'double_opt_in'
          : 'single_opt_in'

      cachedOptInProcess = {
        listId,
        value: optIn,
        timestamp: now,
      }
      return optIn
    }
  } catch (err: any) {
    console.warn(`[Klaviyo List Opt-in Check] Non-fatal fallback: ${err?.message || String(err)}`)
  }

  return 'single_opt_in'
}

/**
 * Categorizes an HTTP error response from Klaviyo JSON:API.
 */
function categorizeKlaviyoError(
  status: number,
  firstError: any,
  listId: string,
): { errorType: KlaviyoErrorType; errorCategory: string } {
  let errorType: KlaviyoErrorType = 'SERVER_ERROR'
  let errorCategory = 'Server Error'

  if (status === 401) {
    errorType = 'AUTH'
    errorCategory = 'Authentication Failure (Invalid or revoked Private API Key)'
  } else if (status === 403) {
    errorType = 'PERMISSION'
    errorCategory = 'Permission Denied (Private API Key is missing required scopes)'
  } else if (status === 404) {
    errorType = 'INVALID_LIST'
    errorCategory = `Resource Not Found (List ID "${listId}" does not exist in Klaviyo account)`
  } else if (status === 400) {
    errorType = 'VALIDATION'
    errorCategory = 'Validation Error (Invalid request schema or malformed identifier)'
  } else if (status === 429) {
    errorType = 'RATE_LIMIT'
    errorCategory = 'Rate Limit Exceeded (Too many requests to Klaviyo)'
  } else if (status >= 500) {
    errorType = 'SERVER_ERROR'
    errorCategory = `Klaviyo Upstream Server Outage (HTTP ${status})`
  }

  return { errorType, errorCategory }
}

/**
 * Subscribes a user's email to the configured Klaviyo newsletter list using Option B:
 * 1. Synchronously create or identify profile (POST /api/profiles/)
 * 2. Synchronously add profile to list (POST /api/lists/{id}/relationships/profiles/) -> verified via HTTP 204
 * 3. Submit marketing consent (POST /api/profile-subscription-bulk-create-jobs/) -> verified via HTTP 202
 */
export async function subscribeToNewsletter(
  rawEmail: string,
  options: SubscribeOptions = {},
): Promise<NewsletterSubscribeResult> {
  // 1. Server-side email validation
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      success: false,
      message: NEWSLETTER_MESSAGES.INVALID_EMAIL,
      errorType: 'VALIDATION',
    }
  }

  const normalizedEmail = rawEmail.trim().toLowerCase()

  if (!isValidEmail(normalizedEmail)) {
    return {
      success: false,
      message: NEWSLETTER_MESSAGES.INVALID_EMAIL,
      errorType: 'VALIDATION',
    }
  }

  const isMockEnv =
    options.useMock === true ||
    process.env.USE_MOCK_KLAVIYO === 'true' ||
    (process.env.NODE_ENV === 'test' && options.useMock !== false && !process.env.KLAVIYO_PRIVATE_API_KEY)

  if (isMockEnv) {
    if (options.forceFail) {
      console.warn('[Klaviyo Mock] Simulating Klaviyo API failure.')
      return {
        success: false,
        message: NEWSLETTER_MESSAGES.API_ERROR,
        errorType: 'SERVER_ERROR',
        isMock: true,
      }
    }

    if (options.forcePartialFail) {
      console.warn('[Klaviyo Mock] Simulating partial failure (list added, consent failed).')
      return {
        success: false,
        message: NEWSLETTER_MESSAGES.API_ERROR,
        errorType: 'CONSENT_ERROR',
        errorDetail: 'List membership succeeded but subscription consent recording failed',
        profileId: 'mock-profile-id',
        addedToList: true,
        consentAccepted: false,
        isMock: true,
      }
    }

    if (options.simulateAlreadySubscribed) {
      return {
        success: true,
        message: NEWSLETTER_MESSAGES.ALREADY_SUBSCRIBED,
        profileId: 'mock-existing-profile-id',
        addedToList: true,
        consentAccepted: true,
        optInProcess: 'single_opt_in',
        isMock: true,
      }
    }

    return {
      success: true,
      message: NEWSLETTER_MESSAGES.SUCCESS,
      profileId: 'mock-new-profile-id',
      addedToList: true,
      consentAccepted: true,
      optInProcess: 'single_opt_in',
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

  const commonHeaders = {
    Authorization: `Klaviyo-API-Key ${apiKey}`,
    revision: KLAVIYO_API_REVISION,
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
    'User-Agent': 'CharlieNews/1.0',
  }

  let profileId: string | null = null

  // =========================================================================
  // STEP 1: Synchronously Create or Identify Profile (POST /api/profiles/)
  // =========================================================================
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const profilePayload = {
      data: {
        type: 'profile',
        attributes: {
          email: normalizedEmail,
          properties: {
            $source: 'Charlie News Website Footer',
          },
        },
      },
    }

    const profileRes = await fetch(`${KLAVIYO_BASE_URL}/profiles/`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(profilePayload),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    const profileJson = await profileRes.json().catch(() => null)

    if (profileRes.status === 201 && profileJson?.data?.id) {
      // Successfully created new profile
      profileId = profileJson.data.id
    } else if (profileRes.status === 409) {
      // Profile already exists in Klaviyo - extract duplicate_profile_id from errors[0].meta
      const firstError = profileJson?.errors?.[0]
      const duplicateId = firstError?.meta?.duplicate_profile_id

      if (duplicateId && typeof duplicateId === 'string') {
        profileId = duplicateId
      } else {
        // Resilient fallback: lookup profile ID by email
        const lookupController = new AbortController()
        const lookupTimeout = setTimeout(() => lookupController.abort(), 8000)

        const lookupRes = await fetch(
          `${KLAVIYO_BASE_URL}/profiles/?filter=equals(email,"${encodeURIComponent(normalizedEmail)}")`,
          {
            method: 'GET',
            headers: commonHeaders,
            signal: lookupController.signal,
          },
        )
        clearTimeout(lookupTimeout)

        if (lookupRes.ok) {
          const lookupJson = await lookupRes.json().catch(() => null)
          profileId = lookupJson?.data?.[0]?.id || null
        }
      }
    } else {
      // Profile creation failed with an unexpected error status
      const firstError = profileJson?.errors?.[0]
      const { errorType, errorCategory } = categorizeKlaviyoError(
        profileRes.status,
        firstError,
        listId,
      )
      console.error(
        `[Klaviyo Profile Creation Error - ${errorCategory}] HTTP ${profileRes.status}: ${firstError?.title || profileRes.statusText} | Detail: ${firstError?.detail || 'none'}`,
      )
      return {
        success: false,
        message: NEWSLETTER_MESSAGES.API_ERROR,
        errorType,
        errorDetail: firstError?.detail || profileRes.statusText,
      }
    }
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError'
    const errorMsg = isTimeout ? 'Profile creation timed out after 10s' : err?.message || String(err)
    console.error(`[Klaviyo Profile Network Error] ${errorMsg}`)
    return {
      success: false,
      message: NEWSLETTER_MESSAGES.API_ERROR,
      errorType: 'NETWORK_ERROR',
      errorDetail: errorMsg,
    }
  }

  if (!profileId) {
    console.error('[Klaviyo Profile Error] Failed to obtain valid Klaviyo profile ID.')
    return {
      success: false,
      message: NEWSLETTER_MESSAGES.API_ERROR,
      errorType: 'PROFILE_ERROR',
      errorDetail: 'Could not resolve profile ID for contact',
    }
  }

  // =========================================================================
  // STEP 2: Synchronously Add Profile to List (POST /api/lists/{id}/relationships/profiles/)
  // Must verify HTTP 204 No Content for immediate list membership confirmation.
  // =========================================================================
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const listPayload = {
      data: [
        {
          type: 'profile',
          id: profileId,
        },
      ],
    }

    const listRes = await fetch(`${KLAVIYO_BASE_URL}/lists/${listId}/relationships/profiles/`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(listPayload),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    // Klaviyo specification returns 204 No Content on successful list attachment
    if (listRes.status !== 204 && !listRes.ok) {
      const errorJson = await listRes.json().catch(() => null)
      const firstError = errorJson?.errors?.[0]
      const { errorType, errorCategory } = categorizeKlaviyoError(
        listRes.status,
        firstError,
        listId,
      )

      console.error(
        `[Klaviyo List Attachment Error - ${errorCategory}] HTTP ${listRes.status}: ${firstError?.title || listRes.statusText} | Detail: ${firstError?.detail || 'none'}`,
      )

      return {
        success: false,
        message: NEWSLETTER_MESSAGES.API_ERROR,
        errorType,
        errorDetail: firstError?.detail || listRes.statusText,
        profileId,
        addedToList: false,
      }
    }
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError'
    const errorMsg = isTimeout ? 'List attachment timed out after 10s' : err?.message || String(err)
    console.error(`[Klaviyo List Attachment Network Error] ${errorMsg}`)
    return {
      success: false,
      message: NEWSLETTER_MESSAGES.API_ERROR,
      errorType: 'NETWORK_ERROR',
      errorDetail: errorMsg,
      profileId,
      addedToList: false,
    }
  }

  // =========================================================================
  // STEP 3: Submit Subscription Consent Request (POST /api/profile-subscription-bulk-create-jobs/)
  // Confirms explicit legal marketing consent (green tick), triggers welcome flows,
  // and adheres to list opt-in and suppression settings.
  // =========================================================================
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const consentPayload = {
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

    const consentRes = await fetch(
      `${KLAVIYO_BASE_URL}/profile-subscription-bulk-create-jobs/`,
      {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify(consentPayload),
        signal: controller.signal,
      },
    )
    clearTimeout(timeout)

    // Check if consent job was accepted by Klaviyo (HTTP 202 Accepted or 200/201)
    if (consentRes.status === 202 || consentRes.ok) {
      // Check list opt-in process setting (single vs double opt-in)
      const optInProcess = await getListOptInProcess(apiKey, listId)

      const successMessage =
        optInProcess === 'double_opt_in'
          ? NEWSLETTER_MESSAGES.DOUBLE_OPT_IN_PENDING
          : NEWSLETTER_MESSAGES.SUCCESS

      return {
        success: true,
        message: successMessage,
        profileId,
        addedToList: true,
        consentAccepted: true,
        optInProcess,
      }
    }

    // PARTIAL FAILURE HANDLING:
    // Profile is in the list (Step 2 succeeded), but consent job was rejected by Klaviyo.
    // In accordance with compliance requirements, we do not claim full success when consent is uncertain.
    const errorJson = await consentRes.json().catch(() => null)
    const firstError = errorJson?.errors?.[0]
    const { errorType, errorCategory } = categorizeKlaviyoError(
      consentRes.status,
      firstError,
      listId,
    )

    console.error(
      `[Klaviyo Partial Failure - ${errorCategory}] Profile added to list (${listId}), but consent job failed with HTTP ${consentRes.status}: ${firstError?.title || consentRes.statusText} | Detail: ${firstError?.detail || 'none'}`,
    )

    return {
      success: false,
      message: NEWSLETTER_MESSAGES.API_ERROR,
      errorType: 'CONSENT_ERROR',
      errorDetail: `List membership succeeded but subscription consent recording failed: ${firstError?.detail || consentRes.statusText}`,
      profileId,
      addedToList: true,
      consentAccepted: false,
    }
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError'
    const errorMsg = isTimeout
      ? 'Consent request timed out after 10s'
      : err?.message || String(err)

    console.error(
      `[Klaviyo Partial Failure - Network Error] Profile added to list (${listId}), but consent submission encountered network error: ${errorMsg}`,
    )

    return {
      success: false,
      message: NEWSLETTER_MESSAGES.API_ERROR,
      errorType: 'CONSENT_ERROR',
      errorDetail: `List membership succeeded but consent submission timed out: ${errorMsg}`,
      profileId,
      addedToList: true,
      consentAccepted: false,
    }
  }
}

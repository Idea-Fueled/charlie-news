import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  subscribeToNewsletter,
  isValidEmail,
  getListOptInProcess,
  clearOptInCache,
} from '@/lib/klaviyo/client'
import { NEWSLETTER_MESSAGES } from '@/lib/klaviyo/types'

describe('Klaviyo Newsletter Client (Option B)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    clearOptInCache()
  })

  describe('Email validation', () => {
    it('validates standard email formats correctly', () => {
      expect(isValidEmail('test@charlienews.com.au')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('not-an-email')).toBe(false)
      expect(isValidEmail('missing@domain')).toBe(false)
      expect(isValidEmail('spaces in@email.com')).toBe(false)
    })
  })

  describe('Mock environment handling', () => {
    it('returns success in mock mode for new profile', async () => {
      const res = await subscribeToNewsletter('new@example.com', { useMock: true })
      expect(res.success).toBe(true)
      expect(res.message).toBe(NEWSLETTER_MESSAGES.SUCCESS)
      expect(res.addedToList).toBe(true)
      expect(res.consentAccepted).toBe(true)
    })

    it('returns standard success for already subscribed profiles without revealing state', async () => {
      const res = await subscribeToNewsletter('existing@example.com', {
        useMock: true,
        simulateAlreadySubscribed: true,
      })
      expect(res.success).toBe(true)
      expect(res.message).toBe(NEWSLETTER_MESSAGES.ALREADY_SUBSCRIBED)
    })

    it('handles simulated failure in mock mode', async () => {
      const res = await subscribeToNewsletter('fail@example.com', {
        useMock: true,
        forceFail: true,
      })
      expect(res.success).toBe(false)
      expect(res.message).toBe(NEWSLETTER_MESSAGES.API_ERROR)
      expect(res.errorType).toBe('SERVER_ERROR')
    })

    it('handles simulated partial failure (list added, consent failed)', async () => {
      const res = await subscribeToNewsletter('partial@example.com', {
        useMock: true,
        forcePartialFail: true,
      })
      expect(res.success).toBe(false)
      expect(res.errorType).toBe('CONSENT_ERROR')
      expect(res.addedToList).toBe(true)
      expect(res.consentAccepted).toBe(false)
    })
  })

  describe('Option B Multi-Step Sequential Flow with Fetch Mocking', () => {
    const originalEnv = { ...process.env }

    beforeEach(() => {
      process.env.KLAVIYO_PRIVATE_API_KEY = 'pk_test_123456789'
      process.env.KLAVIYO_LIST_ID = 'TEST_LIST_ID'
      delete process.env.USE_MOCK_KLAVIYO
    })

    it('successfully executes the 3-step sequence for a new profile', async () => {
      const fetchMock = vi.fn()

      // Step 1: POST /api/profiles/ -> 201 Created
      fetchMock.mockResolvedValueOnce({
        status: 201,
        ok: true,
        json: async () => ({
          data: { id: 'PROFILE_NEW_123', type: 'profile' },
        }),
      })

      // Step 2: POST /api/lists/TEST_LIST_ID/relationships/profiles/ -> 204 No Content
      fetchMock.mockResolvedValueOnce({
        status: 204,
        ok: true,
        text: async () => '',
      })

      // Step 3: POST /api/profile-subscription-bulk-create-jobs/ -> 202 Accepted
      fetchMock.mockResolvedValueOnce({
        status: 202,
        ok: true,
        text: async () => '',
      })

      // List settings check: GET /api/lists/TEST_LIST_ID/ -> 200 OK
      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          data: { attributes: { opt_in_process: 'single_opt_in' } },
        }),
      })

      global.fetch = fetchMock

      const result = await subscribeToNewsletter('newsubscriber@example.com')

      expect(result.success).toBe(true)
      expect(result.message).toBe(NEWSLETTER_MESSAGES.SUCCESS)
      expect(result.profileId).toBe('PROFILE_NEW_123')
      expect(result.addedToList).toBe(true)
      expect(result.consentAccepted).toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(4) // Profiles, List Relationship, Consent Job, List Settings

      // Verify Step 1 payload
      expect(fetchMock.mock.calls[0][0]).toBe('https://a.klaviyo.com/api/profiles/')
      const profileBody = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(profileBody.data.attributes.email).toBe('newsubscriber@example.com')

      // Verify Step 2 payload
      expect(fetchMock.mock.calls[1][0]).toBe(
        'https://a.klaviyo.com/api/lists/TEST_LIST_ID/relationships/profiles/',
      )
      const listBody = JSON.parse(fetchMock.mock.calls[1][1].body)
      expect(listBody.data[0].id).toBe('PROFILE_NEW_123')

      // Verify Step 3 payload
      expect(fetchMock.mock.calls[2][0]).toBe(
        'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/',
      )
    })

    it('correctly handles existing duplicate profiles (409 Conflict) without separate search', async () => {
      const fetchMock = vi.fn()

      // Step 1: POST /api/profiles/ -> 409 Conflict with duplicate_profile_id
      fetchMock.mockResolvedValueOnce({
        status: 409,
        ok: false,
        json: async () => ({
          errors: [
            {
              code: 'duplicate_profile',
              meta: {
                duplicate_profile_id: 'PROFILE_EXISTING_999',
              },
            },
          ],
        }),
      })

      // Step 2: POST /api/lists/TEST_LIST_ID/relationships/profiles/ -> 204 No Content
      fetchMock.mockResolvedValueOnce({
        status: 204,
        ok: true,
        text: async () => '',
      })

      // Step 3: POST /api/profile-subscription-bulk-create-jobs/ -> 202 Accepted
      fetchMock.mockResolvedValueOnce({
        status: 202,
        ok: true,
        text: async () => '',
      })

      global.fetch = fetchMock

      const result = await subscribeToNewsletter('existing@example.com')

      expect(result.success).toBe(true)
      expect(result.profileId).toBe('PROFILE_EXISTING_999')
      expect(result.addedToList).toBe(true)
      expect(result.consentAccepted).toBe(true)
      // Step 2 must be called with the extracted duplicate profile ID
      const listBody = JSON.parse(fetchMock.mock.calls[1][1].body)
      expect(listBody.data[0].id).toBe('PROFILE_EXISTING_999')
    })

    it('truthfully handles partial failure when list attachment succeeds but consent recording fails', async () => {
      const fetchMock = vi.fn()

      // Step 1: POST /api/profiles/ -> 201 Created
      fetchMock.mockResolvedValueOnce({
        status: 201,
        ok: true,
        json: async () => ({
          data: { id: 'PROFILE_123', type: 'profile' },
        }),
      })

      // Step 2: POST /api/lists/TEST_LIST_ID/relationships/profiles/ -> 204 No Content
      fetchMock.mockResolvedValueOnce({
        status: 204,
        ok: true,
        text: async () => '',
      })

      // Step 3: POST /api/profile-subscription-bulk-create-jobs/ -> 500 Internal Server Error
      fetchMock.mockResolvedValueOnce({
        status: 500,
        ok: false,
        json: async () => ({
          errors: [{ title: 'Service Unavailable' }],
        }),
      })

      global.fetch = fetchMock

      const result = await subscribeToNewsletter('partialfail@example.com')

      // Must not report success because consent failed
      expect(result.success).toBe(false)
      expect(result.errorType).toBe('CONSENT_ERROR')
      expect(result.addedToList).toBe(true)
      expect(result.consentAccepted).toBe(false)
      expect(result.message).toBe(NEWSLETTER_MESSAGES.API_ERROR)
    })

    it('aborts and returns failure if list attachment fails (non-204)', async () => {
      const fetchMock = vi.fn()

      // Step 1: POST /api/profiles/ -> 201 Created
      fetchMock.mockResolvedValueOnce({
        status: 201,
        ok: true,
        json: async () => ({
          data: { id: 'PROFILE_123', type: 'profile' },
        }),
      })

      // Step 2: POST /api/lists/TEST_LIST_ID/relationships/profiles/ -> 404 Invalid List
      fetchMock.mockResolvedValueOnce({
        status: 404,
        ok: false,
        json: async () => ({
          errors: [{ title: 'List Not Found', detail: 'Invalid list' }],
        }),
      })

      global.fetch = fetchMock

      const result = await subscribeToNewsletter('badlist@example.com')

      expect(result.success).toBe(false)
      expect(result.errorType).toBe('INVALID_LIST')
      expect(result.addedToList).toBe(false)
      // Step 3 (consent) must NOT have been called
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('returns double opt-in message when configured on the Klaviyo list', async () => {
      const fetchMock = vi.fn()

      fetchMock.mockResolvedValueOnce({
        status: 201,
        ok: true,
        json: async () => ({ data: { id: 'PROF_DOUBLE' } }),
      })
      fetchMock.mockResolvedValueOnce({
        status: 204,
        ok: true,
        text: async () => '',
      })
      fetchMock.mockResolvedValueOnce({
        status: 202,
        ok: true,
        text: async () => '',
      })
      // List check returns double_opt_in
      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          data: { attributes: { opt_in_process: 'double_opt_in' } },
        }),
      })

      global.fetch = fetchMock

      const result = await subscribeToNewsletter('doubleoptin@example.com')

      expect(result.success).toBe(true)
      expect(result.message).toBe(NEWSLETTER_MESSAGES.DOUBLE_OPT_IN_PENDING)
      expect(result.optInProcess).toBe('double_opt_in')
    })
  })

  describe('Route Handler /api/newsletter/subscribe', () => {
    it('blocks spam bots via honeypot field silently returning success', async () => {
      const { POST } = await import('@/app/api/newsletter/subscribe/route')
      const req = new Request('http://localhost:3005/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'bot@spam.com',
          b_trap: 'bot_input_detected',
        }),
      })

      const res = await POST(req as any)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe(NEWSLETTER_MESSAGES.SUCCESS)
    })

    it('rejects invalid email with 400 Bad Request', async () => {
      const { POST } = await import('@/app/api/newsletter/subscribe/route')
      const req = new Request('http://localhost:3005/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
        }),
      })

      const res = await POST(req as any)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe(NEWSLETTER_MESSAGES.INVALID_EMAIL)
    })

    it('returns diagnostic info via GET without exposing private tokens', async () => {
      const { GET } = await import('@/app/api/newsletter/subscribe/route')
      const res = await GET()
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.service).toBe('Klaviyo Newsletter')
      expect(data.status).toBe('active')
      expect(typeof data.configured).toBe('boolean')
      expect(data.diagnostics).toHaveProperty('hasApiKey')
      expect(data.diagnostics).toHaveProperty('hasListId')
      // Must not expose full API key
      expect(data.diagnostics).not.toHaveProperty('apiKey')
      expect(data.diagnostics).not.toHaveProperty('privateKey')
    })
  })
})

/**
 * Klaviyo Newsletter Integration Types
 */

export type KlaviyoErrorType =
  | 'AUTH'
  | 'PERMISSION'
  | 'INVALID_LIST'
  | 'VALIDATION'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'CONFIG_ERROR'
  | 'CONSENT_ERROR'
  | 'LIST_ATTACH_ERROR'
  | 'PROFILE_ERROR'

export interface NewsletterSubscribeResult {
  success: boolean
  message: string
  isMock?: boolean
  errorType?: KlaviyoErrorType
  errorDetail?: string
  profileId?: string
  addedToList?: boolean
  consentAccepted?: boolean
  optInProcess?: 'single_opt_in' | 'double_opt_in'
}

export interface SubscribeOptions {
  useMock?: boolean
  forceFail?: boolean
  forcePartialFail?: boolean
  simulateAlreadySubscribed?: boolean
}

export const NEWSLETTER_MESSAGES = {
  SUCCESS: 'Thanks for signing up.',
  DOUBLE_OPT_IN_PENDING: 'Please check your email to confirm your subscription.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  ALREADY_SUBSCRIBED: 'Thanks for signing up.', // Privacy rule: never reveal existing subscription status
  API_ERROR: 'Something went wrong. Please try again.',
  DISCLAIMER: "We'll email you the latest property news. Unsubscribe anytime.",
} as const

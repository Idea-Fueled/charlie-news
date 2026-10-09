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

export interface NewsletterSubscribeResult {
  success: boolean
  message: string
  isMock?: boolean
  errorType?: KlaviyoErrorType
  errorDetail?: string
}

export interface SubscribeOptions {
  useMock?: boolean
  forceFail?: boolean
  simulateAlreadySubscribed?: boolean
}

export const NEWSLETTER_MESSAGES = {
  SUCCESS: 'Thanks for signing up.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  ALREADY_SUBSCRIBED: 'Thanks for signing up.', // Privacy rule: never reveal existing subscription status
  API_ERROR: 'Something went wrong. Please try again.',
  DISCLAIMER: "We'll email you the latest property news. Unsubscribe anytime.",
} as const

export type DateFormatStyle = 'long' | 'short'

/**
 * Global date format preference.
 * Defaults to 'long' (e.g. "25 November 2026") as seen on Hero and Article pages.
 * Easily switchable or configurable via NEXT_PUBLIC_DATE_FORMAT_STYLE or marketing preference.
 */
export const DEFAULT_DATE_FORMAT_STYLE: DateFormatStyle =
  (process.env.NEXT_PUBLIC_DATE_FORMAT_STYLE as DateFormatStyle) || 'long'

/**
 * Standardized date formatting across all public website components.
 * Guarantees en-AU locale and Australia/Melbourne timezone.
 */
export function formatArticleDate(
  dateInput?: string | Date | null,
  options?: {
    style?: DateFormatStyle
    fallback?: string
  },
): string {
  if (!dateInput) return options?.fallback || 'Recent'

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return options?.fallback || 'Recent'

  const style = options?.style || DEFAULT_DATE_FORMAT_STYLE
  const monthFormat = style === 'short' ? 'short' : 'long'

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: monthFormat,
    year: 'numeric',
    timeZone: 'Australia/Melbourne',
  }).format(date)
}

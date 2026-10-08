/**
 * Sydney Timezone & Scheduling Engine for Charlie News
 * Handles Australia/Sydney timezone conversions, AEST/AEDT detection,
 * and validates the 4 SOW execution slots (6 AM, 10 AM, 2 PM, 6 PM Sydney time).
 */

export const SCHEDULED_SYDNEY_HOURS = [6, 10, 14, 18] as const
export type ScheduledSydneyHour = (typeof SCHEDULED_SYDNEY_HOURS)[number]

/**
 * Corresponding UTC hours for Vercel Cron:
 * - In AEDT (UTC+11, Oct-Apr): 19:00, 23:00, 03:00, 07:00 UTC
 * - In AEST (UTC+10, Apr-Oct): 20:00, 00:00, 04:00, 08:00 UTC
 * Unified UTC cron list: [19, 20, 23, 0, 3, 4, 7, 8]
 */
export const VERCEL_CRON_UTC_HOURS = [19, 20, 23, 0, 3, 4, 7, 8] as const

export interface SydneyTimeInfo {
  year: number
  month: number // 1-12
  day: number // 1-31
  hour: number // 0-23
  minute: number // 0-59
  second: number // 0-59
  timeZoneName: 'AEST' | 'AEDT'
  utcOffsetHours: 10 | 11
  isDst: boolean
  dateString: string // YYYY-MM-DD
  timeString: string // HH:mm
  slotKey: string // YYYY-MM-DD-HH
  formatted: string // "HH:mm Sydney (AEST/AEDT)"
  startOfDayUtc: Date
  endOfDayUtc: Date
}

/**
 * Computes exact Sydney time information for any given Date or epoch.
 */
export function getSydneyTime(date: Date = new Date()): SydneyTimeInfo {
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  })

  const parts = formatter.formatToParts(date)
  const partMap: Record<string, string> = {}
  for (const p of parts) {
    partMap[p.type] = p.value
  }

  const year = parseInt(partMap.year, 10)
  const month = parseInt(partMap.month, 10)
  const day = parseInt(partMap.day, 10)
  const hour = parseInt(partMap.hour, 10)
  const minute = parseInt(partMap.minute, 10)
  const second = parseInt(partMap.second, 10)

  // Compute exact UTC offset for this specific instant in Sydney
  const sydneyAsUtcEpoch = Date.UTC(year, month - 1, day, hour, minute, second)
  const offsetMs = sydneyAsUtcEpoch - date.getTime()
  const offsetHours = Math.round(offsetMs / (3600 * 1000))
  const utcOffsetHours: 10 | 11 = offsetHours === 11 ? 11 : 10
  const isDst = utcOffsetHours === 11
  const timeZoneName: 'AEST' | 'AEDT' = isDst ? 'AEDT' : 'AEST'

  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  const slotKey = `${dateString}-${String(hour).padStart(2, '0')}`

  // Precise UTC timestamps for Sydney calendar day start and end
  const startOfDayEpoch = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMs
  const endOfDayEpoch = Date.UTC(year, month - 1, day, 23, 59, 59, 999) - offsetMs

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    timeZoneName,
    utcOffsetHours,
    isDst,
    dateString,
    timeString,
    slotKey,
    formatted: `${timeString} Sydney (${timeZoneName})`,
    startOfDayUtc: new Date(startOfDayEpoch),
    endOfDayUtc: new Date(endOfDayEpoch),
  }
}

export interface SydneyScheduleCheck {
  isScheduled: boolean
  sydneyHour: number
  sydneyMinute: number
  matchedSlot?: ScheduledSydneyHour
  timeZoneName: 'AEST' | 'AEDT'
  formattedSydneyTime: string
  slotKey: string
  reason?: string
}

/**
 * Validates whether the current execution time matches one of the 4 SOW Sydney slots:
 * - 6:00 AM Sydney (hour 6)
 * - 10:00 AM Sydney (hour 10)
 * - 2:00 PM Sydney (hour 14)
 * - 6:00 PM Sydney (hour 18)
 *
 * Allows execution within the scheduled hour window (minutes 0 to 59).
 */
export function checkSydneySchedule(date: Date = new Date()): SydneyScheduleCheck {
  const sydney = getSydneyTime(date)
  const isMatch = (SCHEDULED_SYDNEY_HOURS as readonly number[]).includes(sydney.hour)

  if (isMatch) {
    return {
      isScheduled: true,
      sydneyHour: sydney.hour,
      sydneyMinute: sydney.minute,
      matchedSlot: sydney.hour as ScheduledSydneyHour,
      timeZoneName: sydney.timeZoneName,
      formattedSydneyTime: sydney.formatted,
      slotKey: sydney.slotKey,
    }
  }

  const slotLabels = SCHEDULED_SYDNEY_HOURS.map((h) => {
    if (h === 6) return '6:00 AM'
    if (h === 10) return '10:00 AM'
    if (h === 14) return '2:00 PM'
    if (h === 18) return '6:00 PM'
    return `${h}:00`
  }).join(', ')

  return {
    isScheduled: false,
    sydneyHour: sydney.hour,
    sydneyMinute: sydney.minute,
    timeZoneName: sydney.timeZoneName,
    formattedSydneyTime: sydney.formatted,
    slotKey: sydney.slotKey,
    reason: `Off-schedule Sydney hour. Current Sydney time is ${sydney.formatted}. SOW scheduled execution slots are ${slotLabels} Sydney time.`,
  }
}

/**
 * Helper mapping Sydney local hour to the expected UTC hour depending on DST.
 */
export function getUtcHourForSydneySlot(sydneyHour: ScheduledSydneyHour, isDst: boolean): number {
  const offset = isDst ? 11 : 10
  const utc = sydneyHour - offset
  return (utc + 24) % 24
}

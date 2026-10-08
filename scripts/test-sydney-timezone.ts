import {
  checkSydneySchedule,
  getSydneyTime,
  getUtcHourForSydneySlot,
  SCHEDULED_SYDNEY_HOURS,
  VERCEL_CRON_UTC_HOURS,
} from '../src/lib/automation/timezone'

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAILED: ${msg}`)
    process.exit(1)
  }
  console.log(`  ✓ ${msg}`)
}

console.log('================================================================')
console.log('CHARLIE NEWS - SYDNEY TIMEZONE & CRON SCHEDULE TEST SUITE')
console.log('================================================================\n')

// -------------------------------------------------------------
// TEST 1: AEDT (Daylight Saving Time, UTC+11) — e.g. January 15
// -------------------------------------------------------------
console.log('--- TEST 1: AEDT (Daylight Saving, UTC+11) ---')

// 1a. 6:00 AM Sydney in AEDT is UTC 19:00 previous day
const aedt6am = new Date('2026-01-15T19:00:00Z')
const checkAedt6am = checkSydneySchedule(aedt6am)
assert(checkAedt6am.isScheduled === true, 'UTC 19:00 in AEDT is scheduled (Sydney 6:00 AM)')
assert(checkAedt6am.matchedSlot === 6, 'Matched slot is 6 (6 AM)')
assert(checkAedt6am.timeZoneName === 'AEDT', 'Timezone detected as AEDT')
assert(checkAedt6am.sydneyHour === 6, 'Sydney hour is 6')

// 1b. UTC 20:00 in AEDT is Sydney 7:00 AM -> NOT scheduled
const aedt7am = new Date('2026-01-15T20:00:00Z')
const checkAedt7am = checkSydneySchedule(aedt7am)
assert(checkAedt7am.isScheduled === false, 'UTC 20:00 in AEDT is skipped (Sydney 7:00 AM)')

// 1c. 10:00 AM Sydney in AEDT is UTC 23:00 previous day
const aedt10am = new Date('2026-01-15T23:00:00Z')
const checkAedt10am = checkSydneySchedule(aedt10am)
assert(checkAedt10am.isScheduled === true, 'UTC 23:00 in AEDT is scheduled (Sydney 10:00 AM)')
assert(checkAedt10am.matchedSlot === 10, 'Matched slot is 10 (10 AM)')

// 1d. UTC 00:00 in AEDT is Sydney 11:00 AM -> NOT scheduled
const aedt11am = new Date('2026-01-16T00:00:00Z')
const checkAedt11am = checkSydneySchedule(aedt11am)
assert(checkAedt11am.isScheduled === false, 'UTC 00:00 in AEDT is skipped (Sydney 11:00 AM)')

// 1e. 2:00 PM Sydney in AEDT is UTC 03:00
const aedt2pm = new Date('2026-01-16T03:00:00Z')
const checkAedt2pm = checkSydneySchedule(aedt2pm)
assert(checkAedt2pm.isScheduled === true, 'UTC 03:00 in AEDT is scheduled (Sydney 2:00 PM)')
assert(checkAedt2pm.matchedSlot === 14, 'Matched slot is 14 (2 PM)')

// 1f. UTC 04:00 in AEDT is Sydney 3:00 PM -> NOT scheduled
const aedt3pm = new Date('2026-01-16T04:00:00Z')
const checkAedt3pm = checkSydneySchedule(aedt3pm)
assert(checkAedt3pm.isScheduled === false, 'UTC 04:00 in AEDT is skipped (Sydney 3:00 PM)')

// 1g. 6:00 PM Sydney in AEDT is UTC 07:00
const aedt6pm = new Date('2026-01-16T07:00:00Z')
const checkAedt6pm = checkSydneySchedule(aedt6pm)
assert(checkAedt6pm.isScheduled === true, 'UTC 07:00 in AEDT is scheduled (Sydney 6:00 PM)')
assert(checkAedt6pm.matchedSlot === 18, 'Matched slot is 18 (6 PM)')

// 1h. UTC 08:00 in AEDT is Sydney 7:00 PM -> NOT scheduled
const aedt7pm = new Date('2026-01-16T08:00:00Z')
const checkAedt7pm = checkSydneySchedule(aedt7pm)
assert(checkAedt7pm.isScheduled === false, 'UTC 08:00 in AEDT is skipped (Sydney 7:00 PM)')

// -------------------------------------------------------------
// TEST 2: AEST (Standard Time, UTC+10) — e.g. July 15
// -------------------------------------------------------------
console.log('\n--- TEST 2: AEST (Standard Time, UTC+10) ---')

// 2a. UTC 19:00 in AEST is Sydney 5:00 AM -> NOT scheduled
const aest5am = new Date('2026-07-15T19:00:00Z')
const checkAest5am = checkSydneySchedule(aest5am)
assert(checkAest5am.isScheduled === false, 'UTC 19:00 in AEST is skipped (Sydney 5:00 AM)')

// 2b. 6:00 AM Sydney in AEST is UTC 20:00 previous day
const aest6am = new Date('2026-07-15T20:00:00Z')
const checkAest6am = checkSydneySchedule(aest6am)
assert(checkAest6am.isScheduled === true, 'UTC 20:00 in AEST is scheduled (Sydney 6:00 AM)')
assert(checkAest6am.matchedSlot === 6, 'Matched slot is 6 (6 AM)')
assert(checkAest6am.timeZoneName === 'AEST', 'Timezone detected as AEST')

// 2c. UTC 23:00 in AEST is Sydney 9:00 AM -> NOT scheduled
const aest9am = new Date('2026-07-15T23:00:00Z')
const checkAest9am = checkSydneySchedule(aest9am)
assert(checkAest9am.isScheduled === false, 'UTC 23:00 in AEST is skipped (Sydney 9:00 AM)')

// 2d. 10:00 AM Sydney in AEST is UTC 00:00 same day
const aest10am = new Date('2026-07-16T00:00:00Z')
const checkAest10am = checkSydneySchedule(aest10am)
assert(checkAest10am.isScheduled === true, 'UTC 00:00 in AEST is scheduled (Sydney 10:00 AM)')
assert(checkAest10am.matchedSlot === 10, 'Matched slot is 10 (10 AM)')

// 2e. UTC 03:00 in AEST is Sydney 1:00 PM -> NOT scheduled
const aest1pm = new Date('2026-07-16T03:00:00Z')
const checkAest1pm = checkSydneySchedule(aest1pm)
assert(checkAest1pm.isScheduled === false, 'UTC 03:00 in AEST is skipped (Sydney 1:00 PM)')

// 2f. 2:00 PM Sydney in AEST is UTC 04:00 same day
const aest2pm = new Date('2026-07-16T04:00:00Z')
const checkAest2pm = checkSydneySchedule(aest2pm)
assert(checkAest2pm.isScheduled === true, 'UTC 04:00 in AEST is scheduled (Sydney 2:00 PM)')
assert(checkAest2pm.matchedSlot === 14, 'Matched slot is 14 (2 PM)')

// 2g. UTC 07:00 in AEST is Sydney 5:00 PM -> NOT scheduled
const aest5pm = new Date('2026-07-16T07:00:00Z')
const checkAest5pm = checkSydneySchedule(aest5pm)
assert(checkAest5pm.isScheduled === false, 'UTC 07:00 in AEST is skipped (Sydney 5:00 PM)')

// 2h. 6:00 PM Sydney in AEST is UTC 08:00 same day
const aest6pm = new Date('2026-07-16T08:00:00Z')
const checkAest6pm = checkSydneySchedule(aest6pm)
assert(checkAest6pm.isScheduled === true, 'UTC 08:00 in AEST is scheduled (Sydney 6:00 PM)')
assert(checkAest6pm.matchedSlot === 18, 'Matched slot is 18 (6 PM)')

// -------------------------------------------------------------
// TEST 3: Calendar Day Boundary Calculations
// -------------------------------------------------------------
console.log('\n--- TEST 3: Sydney Day Boundaries (Midnight to Midnight) ---')
const infoAedt = getSydneyTime(new Date('2026-01-16T04:00:00Z'))
const startAedtSydney = getSydneyTime(infoAedt.startOfDayUtc)
assert(
  startAedtSydney.hour === 0 && startAedtSydney.minute === 0,
  'AEDT startOfDayUtc maps precisely to 00:00 Sydney time',
)

const infoAest = getSydneyTime(new Date('2026-07-16T04:00:00Z'))
const startAestSydney = getSydneyTime(infoAest.startOfDayUtc)
assert(
  startAestSydney.hour === 0 && startAestSydney.minute === 0,
  'AEST startOfDayUtc maps precisely to 00:00 Sydney time',
)

// -------------------------------------------------------------
// TEST 4: UTC Cron Hours Completeness Check
// -------------------------------------------------------------
console.log('\n--- TEST 4: Unified Cron Schedule Completeness ---')
for (const sydneyHour of SCHEDULED_SYDNEY_HOURS) {
  const utcAedt = getUtcHourForSydneySlot(sydneyHour, true)
  const utcAest = getUtcHourForSydneySlot(sydneyHour, false)
  assert(
    (VERCEL_CRON_UTC_HOURS as readonly number[]).includes(utcAedt),
    `AEDT ${sydneyHour}:00 Sydney maps to UTC ${utcAedt}:00 which is in VERCEL_CRON_UTC_HOURS`,
  )
  assert(
    (VERCEL_CRON_UTC_HOURS as readonly number[]).includes(utcAest),
    `AEST ${sydneyHour}:00 Sydney maps to UTC ${utcAest}:00 which is in VERCEL_CRON_UTC_HOURS`,
  )
}

console.log('\n================================================================')
console.log('ALL TIMEZONE & CRON SCHEDULE TESTS PASSED SUCCESSFULLY!')
console.log('================================================================')
process.exit(0)

import { LAUNCH_DATE, PUZZLE_TIMEZONE } from '../config'

/**
 * Everything about "which day is it?" lives here.
 *
 * The puzzle rolls over at midnight in Singapore, not wherever the player
 * happens to be. So we never ask the browser for the local date - we ask
 * Intl what the date is *in Asia/Singapore* right now.
 */

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: PUZZLE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** The current puzzle date as "YYYY-MM-DD" in Singapore time. */
export function getPuzzleDate(now: Date = new Date()): string {
  const parts = formatter.formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Turn "YYYY-MM-DD" into a UTC timestamp so we can subtract two dates safely. */
function dateStringToUtcMs(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Whole days from one "YYYY-MM-DD" to another. */
export function daysBetween(fromDate: string, toDate: string): number {
  const ms = dateStringToUtcMs(toDate) - dateStringToUtcMs(fromDate)
  return Math.round(ms / 86400000)
}

/** Puzzle number: launch day is #1, the next day is #2, and so on. */
export function getPuzzleNumber(dateStr: string): number {
  return daysBetween(LAUNCH_DATE, dateStr) + 1
}

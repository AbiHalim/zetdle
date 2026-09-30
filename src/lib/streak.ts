import { daysBetween, getPuzzleDate } from './date'

/**
 * Streaks and personal bests.
 *
 * Pure on purpose: this module knows nothing about React or Supabase, so it
 * runs under plain node in the tests. The history it works on arrives over the
 * network, so it is treated as exactly as untrusted as the localStorage data
 * in storage.ts - malformed entries are dropped rather than allowed to turn a
 * count into NaN.
 */

/**
 * One day's best run. Defined here rather than next to the network code so the
 * pure modules never have to import the Supabase SDK.
 */
export interface PlayedDay {
  /** The Singapore date, "YYYY-MM-DD". */
  date: string
  score: number
  /** Total time spent answering that day, in milliseconds. */
  totalMs: number
}

export interface StreakInfo {
  /**
   * Days played in a row, counting back from today - or from yesterday when
   * today has not been played yet, so a streak does not look broken at 9am
   * just because the puzzle is still waiting.
   */
  current: number
  /** The longest run of consecutive days ever played. */
  longest: number
  playedToday: boolean
  /** Alive, but only until midnight: play today or lose it. */
  atRisk: boolean
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Drop anything unusable, remove duplicates, and put the rest in order. */
function tidyDates(dates: string[], today: string): string[] {
  const seen = new Set<string>()

  for (const date of dates) {
    if (typeof date !== 'string' || !DATE_PATTERN.test(date)) continue
    // A wrong device clock, or a forged row, must not inflate a streak.
    if (daysBetween(date, today) < 0) continue
    seen.add(date)
  }

  // Zero-padded ISO dates sort chronologically as plain strings.
  return [...seen].sort()
}

/**
 * Turn a bag of played dates into a streak.
 *
 * `today` is a parameter rather than something read from the clock, so tests
 * can pick a day. It defaults to the Singapore date, which is the only
 * calendar Zetdle has.
 *
 * Playing is what counts, not the score: a zero still marks the day as played,
 * because saveBestResult deliberately keeps an honest blank and a streak is a
 * measure of showing up.
 */
export function computeStreak(
  dates: string[],
  today: string = getPuzzleDate(),
): StreakInfo {
  const days = tidyDates(dates, today)

  if (days.length === 0) {
    return { current: 0, longest: 0, playedToday: false, atRisk: false }
  }

  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    run = daysBetween(days[i - 1], days[i]) === 1 ? run + 1 : 1
    if (run > longest) longest = run
  }

  const gap = daysBetween(days[days.length - 1], today)
  const playedToday = gap === 0

  // Today is a grace day: the streak only breaks on a day that was missed.
  if (gap > 1) {
    return { current: 0, longest, playedToday: false, atRisk: false }
  }

  let current = 1
  for (let i = days.length - 1; i > 0; i--) {
    if (daysBetween(days[i - 1], days[i]) !== 1) break
    current++
  }

  return { current, longest, playedToday, atRisk: !playedToday }
}

/** The best score ever, or null when nothing has been played. */
export function computeHighScore(days: PlayedDay[]): number | null {
  let best: number | null = null

  for (const day of days) {
    if (typeof day?.score !== 'number' || !Number.isFinite(day.score)) continue
    if (best === null || day.score > best) best = day.score
  }

  return best
}

/**
 * Does `score` beat every other day on record?
 *
 * `date` is excluded from the comparison so this gives the same answer whether
 * or not today's row has already been merged into the history. False on a
 * first-ever day - there is nothing to beat, and "New high score!" on day one
 * reads as a joke - and false on a tie, because a tie is not beating it.
 */
export function isNewHighScore(
  days: PlayedDay[],
  date: string,
  score: number,
): boolean {
  const previous = computeHighScore(days.filter((day) => day?.date !== date))
  return previous !== null && score > previous
}

/** "1 day" but "9 days". */
export function formatStreak(days: number): string {
  return `${days} day${days === 1 ? '' : 's'}`
}

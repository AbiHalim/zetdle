/**
 * All the knobs for Zetdle live here.
 * Change a value in this file and the whole app follows.
 */

/** The day Zetdle #1 was played, as a Singapore-time date (YYYY-MM-DD). */
export const LAUNCH_DATE = '2026-09-22'

/** The timezone that decides when a new daily puzzle starts. */
export const PUZZLE_TIMEZONE = 'Asia/Singapore'

/** How long one game lasts, in seconds. */
export const GAME_DURATION_SECONDS = 120

/** The 3-2-1 countdown shown before the timer starts. */
export const COUNTDOWN_SECONDS = 3

/** How many problems each daily puzzle contains (nobody should ever run out). */
export const PROBLEMS_PER_DAY = 300

/** Used in the shareable result text. Replace once the site is deployed. */
export const SITE_URL = 'https://zetdle.vercel.app'

/** Number ranges, copied from Zetamac's default settings. */
export const RANGES = {
  /** Addition (and subtraction, which is addition in reverse): a + b. */
  ADD_A: [2, 100],
  ADD_B: [2, 100],
  /** Multiplication (and division, which is multiplication in reverse): a x b. */
  MUL_A: [2, 12],
  MUL_B: [2, 100],
} as const

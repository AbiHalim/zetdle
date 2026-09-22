import { OPERATIONS } from './problems'
import type { Answer } from './results'

/**
 * Remembering today's result.
 *
 * The only thing we keep on the player's device is their best run of the
 * current puzzle, so that closing or reloading the page does not lose a score
 * they wanted to copy. Nothing is sent anywhere, and yesterday's result is
 * dropped the moment a new puzzle starts.
 */

const STORAGE_KEY = 'zetdle:daily-result:v1'

interface StoredResult {
  date: string
  answers: Answer[]
}

/**
 * localStorage can be missing or throw outright - private windows, blocked
 * site data, odd embedded browsers. Every access goes through here so a
 * failure just means "no saved result" instead of a broken page.
 */
function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** Saved data is untrusted: it may be from an older version, or hand-edited. */
function isAnswer(value: unknown): value is Answer {
  if (typeof value !== 'object' || value === null) return false
  const { problem, seconds } = value as Answer
  return (
    typeof seconds === 'number' &&
    Number.isFinite(seconds) &&
    typeof problem === 'object' &&
    problem !== null &&
    OPERATIONS.includes(problem.op) &&
    typeof problem.left === 'number' &&
    typeof problem.right === 'number' &&
    typeof problem.answer === 'number'
  )
}

/** The saved run for this date, or null if there is nothing usable. */
export function loadResult(
  date: string,
  storage: Storage | null = safeStorage(),
): Answer[] | null {
  if (!storage) return null

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as StoredResult | null
    // A result from a previous puzzle is not today's result.
    if (!parsed || parsed.date !== date) return null
    if (!Array.isArray(parsed.answers) || !parsed.answers.every(isAnswer)) return null

    return parsed.answers
  } catch {
    return null
  }
}

function totalSeconds(answers: Answer[]): number {
  return answers.reduce((sum, a) => sum + a.seconds, 0)
}

/**
 * Is this run better than the one already saved? More correct answers wins;
 * on a tie the quicker run wins, since that is genuinely the better round.
 */
export function isBetterRun(candidate: Answer[], existing: Answer[]): boolean {
  if (candidate.length !== existing.length) return candidate.length > existing.length
  if (candidate.length === 0) return false
  return totalSeconds(candidate) < totalSeconds(existing)
}

/**
 * Keep this run only if it beats what is stored, and return whichever run is
 * now the player's best for the day - that is the one worth showing and
 * sharing. A replay can improve the saved score but never destroy it.
 */
export function saveBestResult(
  date: string,
  answers: Answer[],
  storage: Storage | null = safeStorage(),
): Answer[] {
  const existing = loadResult(date, storage)
  if (existing && !isBetterRun(answers, existing)) return existing

  if (storage) {
    try {
      const payload: StoredResult = { date, answers }
      storage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Storage full or unavailable: the run still shows, it just is not kept.
    }
  }

  return answers
}

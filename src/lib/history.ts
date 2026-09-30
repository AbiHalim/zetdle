import type { Answer } from './results'
import { loadResult } from './storage'
import type { PlayedDay } from './streak'
import { supabase } from './supabase'

/**
 * Reading and writing a player's day-by-day history.
 *
 * Together with supabase.ts this is the only part of the app that touches the
 * network. Every function here returns null instead of throwing: null means
 * "no idea", which every caller renders as the signed-out experience. A player
 * whose connection drops still gets a perfect results screen.
 *
 * Rows arriving from the network are as untrusted as the localStorage data in
 * storage.ts, and are validated the same way before being used.
 */

const TABLE = 'daily_results'
const COLUMNS = 'puzzle_date, score, total_ms'

interface ResultRow {
  puzzle_date: string
  score: number
  total_ms: number
}

function isResultRow(value: unknown): value is ResultRow {
  if (typeof value !== 'object' || value === null) return false
  const row = value as ResultRow
  return (
    typeof row.puzzle_date === 'string' &&
    typeof row.score === 'number' &&
    Number.isFinite(row.score) &&
    typeof row.total_ms === 'number' &&
    Number.isFinite(row.total_ms)
  )
}

function toPlayedDay(row: ResultRow): PlayedDay {
  return { date: row.puzzle_date, score: row.score, totalMs: row.total_ms }
}

/** Total time spent answering, in whole milliseconds. */
export function totalMsOf(answers: Answer[]): number {
  return Math.round(answers.reduce((sum, answer) => sum + answer.seconds * 1000, 0))
}

/** Every day this player has ever played, oldest first. */
export async function fetchHistory(userId: string): Promise<PlayedDay[] | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLUMNS)
      // Redundant under row-level security, but it makes the query read the
      // same way the policy does.
      .eq('user_id', userId)
      .order('puzzle_date')

    if (error || !Array.isArray(data)) return null
    return data.filter(isResultRow).map(toPlayedDay)
  } catch {
    return null
  }
}

/**
 * Send up a finished run. The database keeps whichever run is better, so the
 * row that comes back is already the best of that day - no client-side
 * comparison, and no way for a replay to regress a score.
 */
export async function upsertDailyResult(
  userId: string,
  date: string,
  answers: Answer[],
): Promise<PlayedDay | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(
        {
          user_id: userId,
          puzzle_date: date,
          score: answers.length,
          total_ms: totalMsOf(answers),
        },
        { onConflict: 'user_id,puzzle_date' },
      )
      .select(COLUMNS)
      .single()

    if (error || !isResultRow(data)) return null
    return toPlayedDay(data)
  } catch {
    return null
  }
}

/**
 * Push up today's locally saved run when the server does not have it.
 *
 * One routine covers three situations: signing in after playing signed out,
 * a submit that failed because the network dropped, and a write rejected by
 * a clock-skew check that has since resolved. No retry queue needed.
 */
export async function syncTodayIfNeeded(
  userId: string,
  date: string,
  days: PlayedDay[],
): Promise<PlayedDay | null> {
  const local = loadResult(date)
  if (!local) return null

  const remote = days.find((day) => day.date === date)
  // Only skip when the server is plainly ahead; otherwise let the database
  // decide, since it keeps the better of the two anyway.
  if (remote && remote.score > local.length) return null

  return upsertDailyResult(userId, date, local)
}

import { SITE_URL } from '../config'
import { formatProblem, OPERATIONS, type Operation, type Problem } from './problems'

/**
 * Turning a finished game into numbers, and those numbers into the short
 * summary people paste into group chats.
 */

/** One correctly answered problem, and how long it took. */
export interface Answer {
  problem: Problem
  seconds: number
}

export interface OpStats {
  count: number
  /** null when this operation never came up. */
  avgSeconds: number | null
}

export interface GameStats {
  score: number
  /** null when nothing was answered. */
  avgSeconds: number | null
  perOp: Record<Operation, OpStats>
  slowest: Answer | null
}

export function computeStats(answers: Answer[]): GameStats {
  const perOp = {} as Record<Operation, OpStats>
  for (const op of OPERATIONS) {
    const forOp = answers.filter((a) => a.problem.op === op)
    perOp[op] = {
      count: forOp.length,
      avgSeconds: forOp.length
        ? forOp.reduce((sum, a) => sum + a.seconds, 0) / forOp.length
        : null,
    }
  }

  const slowest = answers.reduce<Answer | null>(
    (worst, a) => (worst === null || a.seconds > worst.seconds ? a : worst),
    null,
  )

  return {
    score: answers.length,
    avgSeconds: answers.length
      ? answers.reduce((sum, a) => sum + a.seconds, 0) / answers.length
      : null,
    perOp,
    slowest,
  }
}

/** Seconds with one decimal place, or a dash when there is nothing to show. */
export function formatSeconds(seconds: number | null): string {
  return seconds === null ? '—' : seconds.toFixed(1)
}

/**
 * The text the "Copy result" button puts on the clipboard, e.g.
 *
 *   🧮 Zetdle #42 — 58
 *   ⏱ 2.1s per answer
 *   🐌 84 ÷ 7 — 6.2s
 *   https://zetdle.vercel.app
 */
export function buildShareText(
  puzzleNumber: number,
  stats: GameStats,
  siteUrl: string = SITE_URL,
): string {
  const lines = [
    `🧮 Zetdle #${puzzleNumber} — ${stats.score}`,
    `⏱ ${formatSeconds(stats.avgSeconds)}s per answer`,
  ]

  // Nothing answered means there is no slowest problem to brag or complain
  // about, so the line is left out rather than shown as a dash.
  if (stats.slowest) lines.push(`🐌 ${formatSlowest(stats.slowest)}`)

  lines.push(siteUrl)
  return lines.join('\n')
}

/** A human-readable line for the slowest problem, e.g. "84 ÷ 7 — 6.2s". */
export function formatSlowest(slowest: Answer | null): string {
  if (!slowest) return '—'
  return `${formatProblem(slowest.problem)} — ${slowest.seconds.toFixed(1)}s`
}

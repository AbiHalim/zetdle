import { HISTORY_CHART_DAYS } from '../config'
import { addDays, daysBetween, getPuzzleDate } from './date'
import type { PlayedDay } from './streak'

/**
 * Working out what the score graph should show.
 *
 * This module returns domain values - which day, what score - and never
 * pixels. The component turns those into coordinates. Keeping the arithmetic
 * here is what lets the graph be tested at all, since there is no React test
 * setup in this project.
 */

export interface ChartPoint {
  /** Position on the calendar axis: 0 is the oldest day in the window. */
  dayIndex: number
  date: string
  score: number
  isToday: boolean
}

export interface ChartData {
  points: ChartPoint[]
  /**
   * Points grouped into runs of consecutive calendar days. Each run is drawn
   * as one line, so a break in play leaves a visible break in the graph.
   */
  runs: ChartPoint[][]
  windowStart: string
  windowDays: number
  /** Top of the y axis. The axis always starts at zero. */
  yMax: number
  best: number | null
}

/**
 * Build the graph for the last `windowDays` days ending today.
 *
 * The x axis is calendar days, not data points. That is the decision the whole
 * graph hangs on: spacing the points evenly would draw a three-day break
 * exactly like three days of play, which would quietly misrepresent the one
 * thing the streak is measuring.
 */
export function buildChartData(
  days: PlayedDay[],
  today: string = getPuzzleDate(),
  windowDays: number = HISTORY_CHART_DAYS,
): ChartData {
  const windowStart = addDays(today, -(windowDays - 1))

  const byDayIndex = new Map<number, ChartPoint>()
  for (const day of days) {
    if (!day || typeof day.date !== 'string') continue
    if (typeof day.score !== 'number' || !Number.isFinite(day.score)) continue

    const dayIndex = daysBetween(windowStart, day.date)
    // Older than the window, or in the future.
    if (dayIndex < 0 || dayIndex > windowDays - 1) continue

    byDayIndex.set(dayIndex, {
      dayIndex,
      date: day.date,
      score: day.score,
      isToday: day.date === today,
    })
  }

  const points = [...byDayIndex.values()].sort((a, b) => a.dayIndex - b.dayIndex)

  const runs: ChartPoint[][] = []
  for (const point of points) {
    const currentRun = runs[runs.length - 1]
    const previous = currentRun?.[currentRun.length - 1]

    if (previous && point.dayIndex === previous.dayIndex + 1) {
      currentRun.push(point)
    } else {
      runs.push([point])
    }
  }

  const best = points.length ? Math.max(...points.map((p) => p.score)) : null

  return {
    points,
    runs,
    windowStart,
    windowDays,
    // Round up to a tidy step so the top label reads well, but never collapse
    // to zero height when every score is small.
    yMax: Math.max(10, Math.ceil((best ?? 0) / 10) * 10),
    best,
  }
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** "2026-09-11" -> "11 Sep", for the axis label. */
export function formatShortDate(date: string): string {
  const [, month, day] = date.split('-')
  const name = MONTHS[Number(month) - 1]
  if (!name || !day) return date
  return `${Number(day)} ${name}`
}

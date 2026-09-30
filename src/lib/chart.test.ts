import { describe, expect, it } from 'vitest'
import { buildChartData, formatShortDate } from './chart'
import type { PlayedDay } from './streak'

const TODAY = '2026-10-10'

function day(date: string, score: number): PlayedDay {
  return { date, score, totalMs: score * 2000 }
}

describe('buildChartData', () => {
  it('handles an empty history', () => {
    const data = buildChartData([], TODAY, 30)
    expect(data.points).toEqual([])
    expect(data.runs).toEqual([])
    expect(data.best).toBeNull()
  })

  it('puts the window start 29 days before today for a 30 day window', () => {
    expect(buildChartData([], TODAY, 30).windowStart).toBe('2026-09-11')
  })

  it('places a day by the calendar, not by its position in the list', () => {
    // Two days of play a week apart must sit a week apart on the axis.
    const data = buildChartData([day('2026-10-03', 10), day('2026-10-10', 20)], TODAY, 30)
    expect(data.points.map((p) => p.dayIndex)).toEqual([22, 29])
  })

  it('marks today', () => {
    const data = buildChartData([day('2026-10-09', 10), day(TODAY, 20)], TODAY, 30)
    expect(data.points.map((p) => p.isToday)).toEqual([false, true])
  })

  it('breaks the line into runs at a gap', () => {
    const data = buildChartData(
      [day('2026-10-06', 1), day('2026-10-07', 2), day('2026-10-09', 3), day(TODAY, 4)],
      TODAY,
      30,
    )
    expect(data.runs.map((run) => run.map((p) => p.date))).toEqual([
      ['2026-10-06', '2026-10-07'],
      ['2026-10-09', '2026-10-10'],
    ])
  })

  it('keeps consecutive days in a single run', () => {
    const dates = ['2026-10-08', '2026-10-09', '2026-10-10']
    const data = buildChartData(dates.map((d) => day(d, 5)), TODAY, 30)
    expect(data.runs).toHaveLength(1)
    expect(data.runs[0]).toHaveLength(3)
  })

  it('leaves a lone day as a run of one', () => {
    const data = buildChartData([day(TODAY, 12)], TODAY, 30)
    expect(data.runs).toEqual([[expect.objectContaining({ date: TODAY })]])
  })

  it('drops days older than the window', () => {
    const data = buildChartData([day('2026-09-10', 99), day(TODAY, 5)], TODAY, 30)
    expect(data.points.map((p) => p.date)).toEqual([TODAY])
    expect(data.best).toBe(5)
  })

  it('keeps the oldest day that is still inside the window', () => {
    const data = buildChartData([day('2026-09-11', 7)], TODAY, 30)
    expect(data.points.map((p) => p.dayIndex)).toEqual([0])
  })

  it('drops days in the future', () => {
    const data = buildChartData([day('2026-10-11', 99), day(TODAY, 5)], TODAY, 30)
    expect(data.points.map((p) => p.date)).toEqual([TODAY])
  })

  it('sorts unsorted input', () => {
    const data = buildChartData([day(TODAY, 3), day('2026-10-08', 1)], TODAY, 30)
    expect(data.points.map((p) => p.date)).toEqual(['2026-10-08', TODAY])
  })

  it('never lets the y axis collapse on small scores', () => {
    expect(buildChartData([day(TODAY, 3)], TODAY, 30).yMax).toBe(10)
    expect(buildChartData([], TODAY, 30).yMax).toBe(10)
  })

  it('rounds the y axis up to a tidy step', () => {
    expect(buildChartData([day(TODAY, 58)], TODAY, 30).yMax).toBe(60)
    expect(buildChartData([day(TODAY, 60)], TODAY, 30).yMax).toBe(60)
    expect(buildChartData([day(TODAY, 61)], TODAY, 30).yMax).toBe(70)
  })

  it('reports the best score in the window', () => {
    const data = buildChartData(
      [day('2026-10-08', 41), day('2026-10-09', 58), day(TODAY, 12)],
      TODAY,
      30,
    )
    expect(data.best).toBe(58)
  })

  it('ignores malformed rows rather than throwing', () => {
    const rows = [
      null,
      { date: 12, score: 5 },
      { date: '2026-10-09', score: 'lots' },
      day(TODAY, 8),
    ] as unknown as PlayedDay[]
    expect(buildChartData(rows, TODAY, 30).points.map((p) => p.date)).toEqual([TODAY])
  })
})

describe('formatShortDate', () => {
  it('reads as a short human date', () => {
    expect(formatShortDate('2026-09-11')).toBe('11 Sep')
    expect(formatShortDate('2026-01-01')).toBe('1 Jan')
    expect(formatShortDate('2026-12-25')).toBe('25 Dec')
  })

  it('leaves anything it cannot parse alone', () => {
    expect(formatShortDate('nonsense')).toBe('nonsense')
  })
})

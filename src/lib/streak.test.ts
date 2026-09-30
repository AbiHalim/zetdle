import { describe, expect, it } from 'vitest'
import { getPuzzleDate } from './date'
import {
  computeHighScore,
  computeStreak,
  formatStreak,
  isNewHighScore,
  type PlayedDay,
} from './streak'

const TODAY = '2026-10-10'

function day(date: string, score = 10): PlayedDay {
  return { date, score, totalMs: score * 2000 }
}

describe('computeStreak', () => {
  it('reports nothing for an empty history', () => {
    expect(computeStreak([], TODAY)).toEqual({
      current: 0,
      longest: 0,
      playedToday: false,
      atRisk: false,
    })
  })

  it('counts today as a streak of one', () => {
    expect(computeStreak(['2026-10-10'], TODAY)).toMatchObject({
      current: 1,
      playedToday: true,
      atRisk: false,
    })
  })

  it('keeps the streak alive when today has not been played yet', () => {
    // The whole point of the grace day: at 9am your streak is not broken.
    expect(computeStreak(['2026-10-09'], TODAY)).toMatchObject({
      current: 1,
      playedToday: false,
      atRisk: true,
    })
  })

  it('breaks the streak once a whole day has been missed', () => {
    expect(computeStreak(['2026-10-08'], TODAY)).toMatchObject({
      current: 0,
      longest: 1,
      atRisk: false,
    })
  })

  it('counts a run ending today', () => {
    const dates = ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10']
    expect(computeStreak(dates, TODAY)).toMatchObject({
      current: 5,
      longest: 5,
      playedToday: true,
      atRisk: false,
    })
  })

  it('counts a run ending yesterday, and flags it as at risk', () => {
    const dates = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']
    expect(computeStreak(dates, TODAY)).toMatchObject({
      current: 5,
      playedToday: false,
      atRisk: true,
    })
  })

  it('stops counting at a gap in the middle', () => {
    const dates = ['2026-10-06', '2026-10-07', '2026-10-09', '2026-10-10']
    expect(computeStreak(dates, TODAY)).toMatchObject({ current: 2, longest: 2 })
  })

  it('remembers a longest run that lives in the past', () => {
    const september = Array.from({ length: 10 }, (_, i) =>
      `2026-09-${String(i + 1).padStart(2, '0')}`,
    )
    expect(computeStreak([...september, '2026-10-10'], TODAY)).toMatchObject({
      current: 1,
      longest: 10,
    })
  })

  it('collapses duplicate dates', () => {
    expect(computeStreak(['2026-10-10', '2026-10-10', '2026-10-09'], TODAY)).toMatchObject({
      current: 2,
    })
  })

  it('does not care what order the dates arrive in', () => {
    expect(computeStreak(['2026-10-10', '2026-10-08', '2026-10-09'], TODAY)).toMatchObject({
      current: 3,
    })
  })

  it('ignores dates in the future', () => {
    // A wrong device clock must not be able to inflate a streak.
    const dates = ['2026-10-10', '2026-10-11', '2026-10-12']
    expect(computeStreak(dates, TODAY)).toMatchObject({ current: 1, longest: 1 })
  })

  it('drops malformed entries instead of producing NaN', () => {
    const dates = ['', 'garbage', '2026-9-1', '2026-10-10']
    const streak = computeStreak(dates as string[], TODAY)
    expect(streak).toMatchObject({ current: 1, longest: 1 })
    expect(Number.isNaN(streak.current)).toBe(false)
  })

  it('counts across a month boundary', () => {
    const dates = ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']
    expect(computeStreak(dates, '2026-10-02')).toMatchObject({ current: 4 })
  })

  it('counts across a leap day', () => {
    const dates = ['2028-02-27', '2028-02-28', '2028-02-29', '2028-03-01']
    expect(computeStreak(dates, '2028-03-01')).toMatchObject({ current: 4 })
  })

  it('defaults to the Singapore date when today is not supplied', () => {
    // Whatever today is in Singapore, a history holding exactly that date is
    // a streak of one - which also proves the default is wired up.
    expect(computeStreak([getPuzzleDate()])).toMatchObject({
      current: 1,
      playedToday: true,
    })
  })
})

describe('high scores', () => {
  const history = [day('2026-10-06', 40), day('2026-10-07', 58), day('2026-10-08', 51)]

  it('finds the best score ever', () => {
    expect(computeHighScore(history)).toBe(58)
  })

  it('has no high score with no history', () => {
    expect(computeHighScore([])).toBeNull()
  })

  it('spots a genuine new high', () => {
    expect(isNewHighScore(history, TODAY, 59)).toBe(true)
  })

  it('does not call a tie a new high', () => {
    expect(isNewHighScore(history, TODAY, 58)).toBe(false)
  })

  it('does not call a lower score a new high', () => {
    expect(isNewHighScore(history, TODAY, 20)).toBe(false)
  })

  it('is never a new high on a first ever day', () => {
    expect(isNewHighScore([], TODAY, 100)).toBe(false)
    expect(isNewHighScore([day(TODAY, 100)], TODAY, 100)).toBe(false)
  })

  it('ignores today own row, already merged or not', () => {
    // Same answer whether or not today's result has been folded into history.
    const withToday = [...history, day(TODAY, 59)]
    expect(isNewHighScore(withToday, TODAY, 59)).toBe(true)
    expect(isNewHighScore(history, TODAY, 59)).toBe(true)
  })
})

describe('formatStreak', () => {
  it('gets the plural right', () => {
    expect(formatStreak(1)).toBe('1 day')
    expect(formatStreak(9)).toBe('9 days')
    expect(formatStreak(0)).toBe('0 days')
  })
})

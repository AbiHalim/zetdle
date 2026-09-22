import { describe, expect, it } from 'vitest'
import { daysBetween, getPuzzleDate, getPuzzleNumber } from './date'
import { LAUNCH_DATE } from '../config'

/** What the date would be for a player sitting in New York at this instant. */
function newYorkDate(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

describe('Singapore puzzle date', () => {
  it('is still the old day one second before midnight SGT', () => {
    // 15:59:59 UTC == 23:59:59 in Singapore (UTC+8)
    expect(getPuzzleDate(new Date('2026-09-22T15:59:59Z'))).toBe('2026-09-22')
  })

  it('flips to the new day exactly at midnight SGT', () => {
    // 16:00:00 UTC == 00:00:00 the next day in Singapore
    expect(getPuzzleDate(new Date('2026-09-22T16:00:00Z'))).toBe('2026-09-23')
  })

  it('does not flip at the player local midnight', () => {
    // Just after midnight in New York, Singapore is already well into the
    // afternoon of the NEXT day - the puzzle must follow Singapore.
    const instant = new Date('2026-09-23T04:30:00Z') // 00:30 in New York
    expect(newYorkDate(instant)).toBe('2026-09-23')
    expect(getPuzzleDate(instant)).toBe('2026-09-23')

    // And the reverse: late evening in New York is already tomorrow in SGT.
    const evening = new Date('2026-09-23T23:30:00Z') // 19:30 in New York
    expect(newYorkDate(evening)).toBe('2026-09-23')
    expect(getPuzzleDate(evening)).toBe('2026-09-24')
  })

  it('handles the start of a year', () => {
    expect(getPuzzleDate(new Date('2026-12-31T16:00:00Z'))).toBe('2027-01-01')
  })
})

describe('puzzle numbering', () => {
  it('makes launch day puzzle #1', () => {
    expect(getPuzzleNumber(LAUNCH_DATE)).toBe(1)
  })

  it('counts up one per day', () => {
    expect(getPuzzleNumber('2026-09-23')).toBe(getPuzzleNumber('2026-09-22') + 1)
  })

  it('counts days correctly across a month boundary', () => {
    expect(daysBetween('2026-09-28', '2026-10-02')).toBe(4)
  })

  it('counts days correctly across a leap day', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2)
  })
})

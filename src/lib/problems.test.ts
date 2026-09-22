import { describe, expect, it } from 'vitest'
import { getDailyProblems, getPracticeProblems, type Problem } from './problems'
import { PROBLEMS_PER_DAY, RANGES } from '../config'

const DATE_A = '2026-09-22'
const DATE_B = '2026-09-23'

function serialise(problems: Problem[]): string {
  return problems.map((p) => `${p.left}${p.op}${p.right}=${p.answer}`).join('|')
}

describe('daily problem generation', () => {
  it('produces the same problems for the same date, every time', () => {
    expect(serialise(getDailyProblems(DATE_A))).toBe(serialise(getDailyProblems(DATE_A)))
  })

  it('produces different problems for different dates', () => {
    expect(serialise(getDailyProblems(DATE_A))).not.toBe(serialise(getDailyProblems(DATE_B)))
  })

  it('generates the configured number of problems', () => {
    expect(getDailyProblems(DATE_A)).toHaveLength(PROBLEMS_PER_DAY)
  })

  it('uses all four operations across a day', () => {
    const ops = new Set(getDailyProblems(DATE_A).map((p) => p.op))
    expect(ops).toEqual(new Set(['add', 'sub', 'mul', 'div']))
  })

  it('is stable against accidental changes to the generator', () => {
    // A snapshot of the first three problems for a fixed date. If this breaks,
    // the daily puzzle has changed for everyone - that is a deliberate decision.
    const first = getDailyProblems(DATE_A, 3)
    expect(serialise(first)).toMatchInlineSnapshot(`"1188div12=99|400div8=50|96div6=16"`)
  })
})

describe('problem ranges and answers', () => {
  // Check several days so we are not testing one lucky seed.
  const days = ['2026-01-01', '2026-06-15', '2026-09-22', '2027-03-08']
  const problems = days.flatMap((d) => getDailyProblems(d))

  it('keeps addition operands within range', () => {
    for (const p of problems.filter((p) => p.op === 'add')) {
      expect(p.left).toBeGreaterThanOrEqual(RANGES.ADD_A[0])
      expect(p.left).toBeLessThanOrEqual(RANGES.ADD_A[1])
      expect(p.right).toBeGreaterThanOrEqual(RANGES.ADD_B[0])
      expect(p.right).toBeLessThanOrEqual(RANGES.ADD_B[1])
      expect(p.answer).toBe(p.left + p.right)
    }
  })

  it('keeps multiplication operands within range', () => {
    for (const p of problems.filter((p) => p.op === 'mul')) {
      expect(p.left).toBeGreaterThanOrEqual(RANGES.MUL_A[0])
      expect(p.left).toBeLessThanOrEqual(RANGES.MUL_A[1])
      expect(p.right).toBeGreaterThanOrEqual(RANGES.MUL_B[0])
      expect(p.right).toBeLessThanOrEqual(RANGES.MUL_B[1])
      expect(p.answer).toBe(p.left * p.right)
    }
  })

  it('never produces a negative subtraction answer', () => {
    for (const p of problems.filter((p) => p.op === 'sub')) {
      expect(p.answer).toBeGreaterThanOrEqual(0)
      expect(p.answer).toBe(p.left - p.right)
      // The subtrahend comes from the addition range.
      expect(p.right).toBeGreaterThanOrEqual(RANGES.ADD_A[0])
      expect(p.right).toBeLessThanOrEqual(RANGES.ADD_A[1])
    }
  })

  it('always produces a whole-number division answer', () => {
    for (const p of problems.filter((p) => p.op === 'div')) {
      expect(Number.isInteger(p.answer)).toBe(true)
      expect(p.answer).toBe(p.left / p.right)
      expect(p.right).toBeGreaterThanOrEqual(RANGES.MUL_A[0])
      expect(p.right).toBeLessThanOrEqual(RANGES.MUL_A[1])
    }
  })

  it('gives each operation a roughly equal share', () => {
    for (const op of ['add', 'sub', 'mul', 'div'] as const) {
      const share = problems.filter((p) => p.op === op).length / problems.length
      expect(share).toBeGreaterThan(0.2)
      expect(share).toBeLessThan(0.3)
    }
  })
})

describe('practice mode', () => {
  it('does not repeat itself between runs', () => {
    expect(serialise(getPracticeProblems(50))).not.toBe(serialise(getPracticeProblems(50)))
  })
})

import { describe, expect, it } from 'vitest'
import { buildShareText, computeStats, type Answer } from './results'
import type { Operation } from './problems'

function answer(op: Operation, seconds: number): Answer {
  return { problem: { op, left: 2, right: 3, answer: 5 }, seconds }
}

describe('computeStats', () => {
  const answers = [
    answer('add', 1.0),
    answer('add', 2.0),
    answer('mul', 3.0),
    answer('div', 6.0),
  ]

  it('scores one point per correct answer', () => {
    expect(computeStats(answers).score).toBe(4)
  })

  it('averages time per answer', () => {
    expect(computeStats(answers).avgSeconds).toBe(3)
  })

  it('averages time per operation', () => {
    const { perOp } = computeStats(answers)
    expect(perOp.add).toEqual({ count: 2, avgSeconds: 1.5 })
    expect(perOp.sub).toEqual({ count: 0, avgSeconds: null })
  })

  it('finds the slowest problem', () => {
    expect(computeStats(answers).slowest?.seconds).toBe(6)
  })

  it('handles a game with no correct answers', () => {
    const stats = computeStats([])
    expect(stats.score).toBe(0)
    expect(stats.avgSeconds).toBeNull()
    expect(stats.slowest).toBeNull()
  })
})

describe('share text', () => {
  it('matches the expected format', () => {
    const stats = computeStats([
      ...Array(3).fill(answer('add', 1.0)),
      ...Array(2).fill(answer('sub', 1.5)),
      answer('mul', 3.0),
      answer('div', 5.0),
    ])
    expect(buildShareText(42, stats, 'https://zetdle.vercel.app')).toBe(
      [
        '🧮 Zetdle #42 — 7',
        '⏱ 2.0s per answer',
        'https://zetdle.vercel.app',
      ].join('\n'),
    )
  })

  it('is three lines with no operation squares', () => {
    const text = buildShareText(7, computeStats([answer('add', 1)]), 'https://x.test')
    expect(text.split('\n')).toHaveLength(3)
    expect(text).not.toMatch(/[\u{1F7E9}\u{1F7E8}\u{1F7E5}\u{2B1B}]/u)
  })

  it('shows a dash when nothing was answered', () => {
    expect(buildShareText(1, computeStats([]), 'https://example.com')).toContain(
      '⏱ —s per answer',
    )
  })
})

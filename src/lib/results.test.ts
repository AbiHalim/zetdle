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
        '🐌 2 ÷ 3 — 5.0s',
        'https://zetdle.vercel.app',
      ].join('\n'),
    )
  })

  it('names the slowest problem and how long it took', () => {
    const stats = computeStats([
      answer('add', 1.0),
      { problem: { op: 'mul', left: 7, right: 23, answer: 161 }, seconds: 6.24 },
    ])
    expect(buildShareText(3, stats, 'https://x.test')).toContain('🐌 7 × 23 — 6.2s')
  })

  it('has no operation squares', () => {
    const text = buildShareText(7, computeStats([answer('add', 1)]), 'https://x.test')
    expect(text).not.toMatch(/[\u{1F7E9}\u{1F7E8}\u{1F7E5}\u{2B1B}]/u)
  })

  it('keeps the site url on the last line', () => {
    const lines = buildShareText(7, computeStats([answer('add', 1)]), 'https://x.test').split('\n')
    expect(lines).toHaveLength(4)
    expect(lines[lines.length - 1]).toBe('https://x.test')
  })

  it('leaves out the slowest line when nothing was answered', () => {
    const text = buildShareText(1, computeStats([]), 'https://example.com')
    expect(text).toContain('⏱ —s per answer')
    expect(text).not.toContain('🐌')
    expect(text.split('\n')).toHaveLength(3)
  })
})

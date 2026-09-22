import { beforeEach, describe, expect, it } from 'vitest'
import { isBetterRun, loadResult, saveBestResult } from './storage'
import type { Answer } from './results'

/** A minimal stand-in for localStorage. */
class FakeStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

/** Storage that refuses everything, like a locked-down private window. */
const brokenStorage: Storage = {
  length: 0,
  clear() {},
  key: () => null,
  removeItem() {},
  getItem() {
    throw new Error('blocked')
  },
  setItem() {
    throw new Error('blocked')
  },
}

const TODAY = '2026-09-22'
const YESTERDAY = '2026-09-21'

function run(count: number, secondsEach = 2): Answer[] {
  return Array.from({ length: count }, () => ({
    problem: { op: 'add' as const, left: 2, right: 3, answer: 5 },
    seconds: secondsEach,
  }))
}

let storage: FakeStorage
beforeEach(() => {
  storage = new FakeStorage()
})

describe('saving and loading', () => {
  it('has nothing saved to begin with', () => {
    expect(loadResult(TODAY, storage)).toBeNull()
  })

  it('saves a run and reads it back', () => {
    saveBestResult(TODAY, run(12), storage)
    expect(loadResult(TODAY, storage)).toHaveLength(12)
  })

  it('ignores a result saved for a different day', () => {
    saveBestResult(YESTERDAY, run(12), storage)
    expect(loadResult(TODAY, storage)).toBeNull()
  })

  it('saves a zero-score run, so an honest blank still survives a reload', () => {
    saveBestResult(TODAY, [], storage)
    expect(loadResult(TODAY, storage)).toEqual([])
  })
})

describe('keeping the best run of the day', () => {
  it('keeps a better run', () => {
    saveBestResult(TODAY, run(10), storage)
    const kept = saveBestResult(TODAY, run(15), storage)
    expect(kept).toHaveLength(15)
    expect(loadResult(TODAY, storage)).toHaveLength(15)
  })

  it('does not let a worse replay destroy the saved score', () => {
    saveBestResult(TODAY, run(58), storage)
    const kept = saveBestResult(TODAY, run(41), storage)
    expect(kept).toHaveLength(58)
    expect(loadResult(TODAY, storage)).toHaveLength(58)
  })

  it('breaks a tie on total time, so the quicker run wins', () => {
    saveBestResult(TODAY, run(10, 3), storage)
    const kept = saveBestResult(TODAY, run(10, 2), storage)
    expect(kept[0].seconds).toBe(2)
  })

  it('keeps the existing run when a tie is not quicker', () => {
    saveBestResult(TODAY, run(10, 2), storage)
    const kept = saveBestResult(TODAY, run(10, 3), storage)
    expect(kept[0].seconds).toBe(2)
  })

  it('compares runs directly', () => {
    expect(isBetterRun(run(5), run(4))).toBe(true)
    expect(isBetterRun(run(4), run(5))).toBe(false)
    expect(isBetterRun(run(5, 1), run(5, 2))).toBe(true)
    expect(isBetterRun([], [])).toBe(false)
  })
})

describe('when the saved data cannot be trusted', () => {
  it('ignores data that is not valid JSON', () => {
    storage.setItem('zetdle:daily-result:v1', 'not json{')
    expect(loadResult(TODAY, storage)).toBeNull()
  })

  it('ignores answers with the wrong shape', () => {
    storage.setItem(
      'zetdle:daily-result:v1',
      JSON.stringify({ date: TODAY, answers: [{ problem: { op: 'nope' }, seconds: 'x' }] }),
    )
    expect(loadResult(TODAY, storage)).toBeNull()
  })

  it('ignores a payload with no answers array', () => {
    storage.setItem('zetdle:daily-result:v1', JSON.stringify({ date: TODAY }))
    expect(loadResult(TODAY, storage)).toBeNull()
  })
})

describe('when storage is unavailable', () => {
  it('reports no saved result instead of throwing', () => {
    expect(loadResult(TODAY, null)).toBeNull()
    expect(loadResult(TODAY, brokenStorage)).toBeNull()
  })

  it('still returns the run that was just played', () => {
    expect(saveBestResult(TODAY, run(9), brokenStorage)).toHaveLength(9)
    expect(saveBestResult(TODAY, run(9), null)).toHaveLength(9)
  })
})

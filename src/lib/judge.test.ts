import { describe, expect, it } from 'vitest'
import { judgeInput } from './judge'

describe('judging a typed answer', () => {
  it('accepts an exact match', () => {
    expect(judgeInput('91', 91)).toBe('correct')
    expect(judgeInput('7', 7)).toBe('correct')
    expect(judgeInput('1188', 1188)).toBe('correct')
  })

  it('treats an unfinished number as still being typed', () => {
    expect(judgeInput('9', 91)).toBe('incomplete')
    expect(judgeInput('8', 91)).toBe('incomplete')
    expect(judgeInput('10', 105)).toBe('incomplete')
  })

  it('calls a full-length mismatch wrong', () => {
    expect(judgeInput('80', 91)).toBe('wrong')
    expect(judgeInput('92', 91)).toBe('wrong')
    expect(judgeInput('104', 105)).toBe('wrong')
  })

  it('judges single-digit answers on the first keystroke', () => {
    expect(judgeInput('3', 7)).toBe('wrong')
    expect(judgeInput('0', 7)).toBe('wrong')
  })

  it('calls anything longer than the answer wrong', () => {
    expect(judgeInput('911', 91)).toBe('wrong')
    expect(judgeInput('71', 7)).toBe('wrong')
  })

  it('treats empty input as incomplete, never wrong', () => {
    expect(judgeInput('', 91)).toBe('incomplete')
    expect(judgeInput('', 7)).toBe('incomplete')
  })

  it('accepts leading zeros that still make the right number', () => {
    expect(judgeInput('07', 7)).toBe('correct')
    expect(judgeInput('091', 91)).toBe('correct')
  })

  it('does not let a correct prefix hide a wrong guess', () => {
    // "10" is a prefix of 105 but a complete, wrong answer to 10 + ... = 12
    expect(judgeInput('10', 12)).toBe('wrong')
  })
})

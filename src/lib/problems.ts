import { PROBLEMS_PER_DAY, RANGES } from '../config'
import { createRng, randInt } from './rng'

/**
 * Problem generation. Pure logic, no React, so it is easy to test.
 * The rules match Zetamac's default settings.
 */

export type Operation = 'add' | 'sub' | 'mul' | 'div'

export const OPERATIONS: Operation[] = ['add', 'sub', 'mul', 'div']

export const OP_SYMBOL: Record<Operation, string> = {
  add: '+',
  sub: '−', // proper minus sign
  mul: '×', // multiplication sign
  div: '÷', // division sign
}

export interface Problem {
  op: Operation
  /** The number shown on the left of the operator. */
  left: number
  /** The number shown on the right of the operator. */
  right: number
  /** The correct answer. */
  answer: number
}

/** Build one problem using the supplied random function. */
export function makeProblem(rand: () => number): Problem {
  const op = OPERATIONS[Math.floor(rand() * OPERATIONS.length)]

  if (op === 'add' || op === 'sub') {
    const a = randInt(rand, RANGES.ADD_A[0], RANGES.ADD_A[1])
    const b = randInt(rand, RANGES.ADD_B[0], RANGES.ADD_B[1])
    // Subtraction is addition in reverse: show (a + b) - a, answer is b.
    return op === 'add'
      ? { op, left: a, right: b, answer: a + b }
      : { op, left: a + b, right: a, answer: b }
  }

  const a = randInt(rand, RANGES.MUL_A[0], RANGES.MUL_A[1])
  const b = randInt(rand, RANGES.MUL_B[0], RANGES.MUL_B[1])
  // Division is multiplication in reverse: show (a * b) / a, answer is b.
  return op === 'mul'
    ? { op, left: a, right: b, answer: a * b }
    : { op, left: a * b, right: a, answer: b }
}

/** Build a list of problems from a given random function. */
export function generateProblems(count: number, rand: () => number): Problem[] {
  const problems: Problem[] = []
  for (let i = 0; i < count; i++) problems.push(makeProblem(rand))
  return problems
}

/**
 * The daily puzzle: seeded by the date, so everyone in the world who plays
 * on the same Singapore day gets the identical list in the identical order.
 */
export function getDailyProblems(
  dateStr: string,
  count: number = PROBLEMS_PER_DAY,
): Problem[] {
  return generateProblems(count, createRng(`zetdle-${dateStr}`))
}

/** Practice mode: genuinely random, nothing shared, nothing to reproduce. */
export function getPracticeProblems(count: number = PROBLEMS_PER_DAY): Problem[] {
  return generateProblems(count, Math.random)
}

/** How a problem reads on screen, e.g. "37 + 82". */
export function formatProblem(problem: Problem): string {
  return `${problem.left} ${OP_SYMBOL[problem.op]} ${problem.right}`
}

/**
 * Deciding whether what has been typed is right, wrong, or still in progress.
 *
 * The game has no Enter key: an answer is accepted the instant it matches. That
 * makes brute force tempting - type 91, 92, 93 until one sticks - so we need to
 * tell a half-typed number apart from a genuine wrong guess. The rule is digit
 * count: you are still typing until you have as many digits as the answer has.
 */

export type Judgement = 'correct' | 'incomplete' | 'wrong'

/**
 * Judge the typed input against the answer.
 *
 * For an answer of 91: "9" is incomplete, "80" is wrong, "91" is correct.
 */
export function judgeInput(input: string, answer: number): Judgement {
  if (input === '') return 'incomplete'
  if (Number(input) === answer) return 'correct'

  // As many digits as the answer, and still not a match: a real guess, and a
  // wrong one. Anything shorter is just a number that is not finished yet.
  return input.length >= String(answer).length ? 'wrong' : 'incomplete'
}

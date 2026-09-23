import { useEffect, useRef, useState } from 'react'
import { CHEAT_IMAGE_URL, GAME_DURATION_SECONDS } from '../config'
import { formatProblem, type Problem } from '../lib/problems'
import type { Answer } from '../lib/results'
import Keypad from './Keypad'
import TopBar from './TopBar'

interface Props {
  problems: Problem[]
  title: string
  isTouch: boolean
  onFinish: (answers: Answer[]) => void
  /** Called when every problem in the list has been answered. */
  onAllAnswered: () => void
}

const MAX_INPUT_LENGTH = 7

export default function Game({
  problems,
  title,
  isTouch,
  onFinish,
  onAllAnswered,
}: Props) {
  /** How many problems have been answered correctly - also the score. */
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [remaining, setRemaining] = useState(GAME_DURATION_SECONDS)

  const answersRef = useRef<Answer[]>([])
  /** When the current problem appeared, used to time each answer. */
  const askedAtRef = useRef(0)
  const finishedRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  const onAllAnsweredRef = useRef(onAllAnswered)
  onAllAnsweredRef.current = onAllAnswered

  // The countdown. We store the end time once and compare against the clock,
  // so the timer stays accurate even if the browser throttles the interval.
  useEffect(() => {
    const start = performance.now()
    askedAtRef.current = start
    const endsAt = start + GAME_DURATION_SECONDS * 1000

    const id = setInterval(() => {
      const left = (endsAt - performance.now()) / 1000
      if (left > 0) {
        setRemaining(left)
        return
      }
      clearInterval(id)
      setRemaining(0)
      if (!finishedRef.current) {
        finishedRef.current = true
        onFinishRef.current(answersRef.current)
      }
    }, 100)

    return () => clearInterval(id)
  }, [])

  const current = problems[index]

  /** Take the would-be new input and either accept the answer or keep typing. */
  function offer(next: string) {
    if (finishedRef.current || !current) return

    if (Number(next) === current.answer) {
      const now = performance.now()
      answersRef.current.push({
        problem: current,
        seconds: (now - askedAtRef.current) / 1000,
      })
      askedAtRef.current = now
      setIndex((i) => i + 1)
      setInput('')

      // Clearing the entire list inside one round is not humanly possible, so
      // this run was automated. No result, no saved score - just the picture.
      if (index + 1 >= problems.length) {
        finishedRef.current = true
        onAllAnsweredRef.current()
      }
    } else {
      // Wrong so far: leave it on screen, no penalty, no clearing.
      setInput(next)
    }
  }

  function pressDigit(digit: string) {
    if (input.length >= MAX_INPUT_LENGTH) return
    offer(input + digit)
  }

  function pressBackspace() {
    setInput((prev) => prev.slice(0, -1))
  }

  // Once the pace is already impossible, quietly fetch the easter egg so it
  // appears instantly instead of loading in front of them. Ordinary players
  // never get close to this, so they never download it.
  useEffect(() => {
    if (index === Math.floor(problems.length * 0.8)) {
      new Image().src = CHEAT_IMAGE_URL
    }
  }, [index, problems.length])

  // Physical keyboard. No dependency array: the listener is re-attached each
  // render so it always sees the current input and problem.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key.length === 1 && event.key >= '0' && event.key <= '9') {
        event.preventDefault()
        pressDigit(event.key)
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        pressBackspace()
      } else if (event.key === 'Escape') {
        setInput('')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <>
      <TopBar title={title} seconds={remaining} />
      <main className="main">
        <div className="problem" aria-live="polite">
          {current ? formatProblem(current) : '—'}
        </div>
        <div className={`answer${input ? ' answer--active' : ''}`}>
          {input || <span className="answer__caret" />}
        </div>
        <div className="score-line">
          {index} correct
        </div>
        {isTouch && <Keypad onDigit={pressDigit} onBackspace={pressBackspace} />}
      </main>
    </>
  )
}

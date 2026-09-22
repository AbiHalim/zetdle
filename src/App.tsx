import { useCallback, useMemo, useState } from 'react'
import { GAME_DURATION_SECONDS } from './config'
import { getPuzzleDate, getPuzzleNumber } from './lib/date'
import { getDailyProblems, getPracticeProblems } from './lib/problems'
import { computeStats, type Answer } from './lib/results'
import Countdown from './components/Countdown'
import Game from './components/Game'
import Results from './components/Results'
import Start from './components/Start'
import TopBar from './components/TopBar'

type Mode = 'daily' | 'practice'
type Phase = 'idle' | 'countdown' | 'playing' | 'done'

export default function App() {
  const [mode, setMode] = useState<Mode>('daily')
  const [phase, setPhase] = useState<Phase>('idle')
  const [answers, setAnswers] = useState<Answer[]>([])
  /** Bumped on every new game so practice mode reshuffles. */
  const [runId, setRunId] = useState(0)
  const [puzzleDate, setPuzzleDate] = useState(getPuzzleDate)

  /** Touch devices get the on-screen keypad; everyone else uses the keyboard. */
  const isTouch = useMemo(
    () => window.matchMedia('(hover: none) and (pointer: coarse)').matches,
    [],
  )

  const isDaily = mode === 'daily'
  const puzzleNumber = useMemo(() => getPuzzleNumber(puzzleDate), [puzzleDate])
  const problems = useMemo(
    () => (isDaily ? getDailyProblems(puzzleDate) : getPracticeProblems()),
    // runId is here on purpose: it reshuffles practice problems each round.
    [isDaily, puzzleDate, runId],
  )

  const title = isDaily ? `Zetdle #${puzzleNumber}` : 'Zetdle · Practice'

  const startGame = useCallback(() => {
    // Re-check the date in case the player has been sitting on this screen
    // since before midnight in Singapore.
    setPuzzleDate(getPuzzleDate())
    setRunId((id) => id + 1)
    setAnswers([])
    setPhase('countdown')
  }, [])

  const switchMode = useCallback(() => {
    setMode((m) => (m === 'daily' ? 'practice' : 'daily'))
    setAnswers([])
    setPhase('idle')
  }, [])

  const finishGame = useCallback((played: Answer[]) => {
    setAnswers(played)
    setPhase('done')
  }, [])

  const startPlaying = useCallback(() => setPhase('playing'), [])

  const stats = useMemo(() => computeStats(answers), [answers])

  if (phase === 'playing') {
    return (
      <div className="app">
        <Game
          // Remounting on a new run resets the timer and the score cleanly.
          key={runId}
          problems={problems}
          title={title}
          isTouch={isTouch}
          onFinish={finishGame}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <TopBar
        title={title}
        seconds={phase === 'done' ? 0 : GAME_DURATION_SECONDS}
      />
      {phase === 'idle' && (
        <Start
          isDaily={isDaily}
          puzzleNumber={puzzleNumber}
          isTouch={isTouch}
          onStart={startGame}
          onSwitchMode={switchMode}
        />
      )}
      {phase === 'countdown' && <Countdown onDone={startPlaying} />}
      {phase === 'done' && (
        <Results
          stats={stats}
          puzzleNumber={puzzleNumber}
          isDaily={isDaily}
          onPlayAgain={startGame}
          onSwitchMode={switchMode}
        />
      )}
    </div>
  )
}

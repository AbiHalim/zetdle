import { useCallback, useMemo, useState } from 'react'
import { GAME_DURATION_SECONDS } from './config'
import { getPuzzleDate, getPuzzleNumber } from './lib/date'
import { getDailyProblems, getPracticeProblems } from './lib/problems'
import { computeStats, type Answer } from './lib/results'
import { loadResult, saveBestResult } from './lib/storage'
import Countdown from './components/Countdown'
import Game from './components/Game'
import Results from './components/Results'
import Start from './components/Start'
import TopBar from './components/TopBar'

type Mode = 'daily' | 'practice'
type Phase = 'idle' | 'countdown' | 'playing' | 'done'

export default function App() {
  // Worked out once, before the first paint, so a player who already has a
  // result for today lands straight on it instead of seeing the start screen.
  const initial = useMemo(() => {
    const date = getPuzzleDate()
    return { date, saved: loadResult(date) }
  }, [])

  const [mode, setMode] = useState<Mode>('daily')
  const [phase, setPhase] = useState<Phase>(initial.saved ? 'done' : 'idle')
  const [puzzleDate, setPuzzleDate] = useState(initial.date)
  /** The best run saved for today, if there is one. */
  const [saved, setSaved] = useState<Answer[] | null>(initial.saved)
  /** The run currently on the results screen. */
  const [answers, setAnswers] = useState<Answer[]>(initial.saved ?? [])
  /** Score of the round just played, so we can say when it was not their best. */
  const [lastRunScore, setLastRunScore] = useState<number | null>(null)
  /** Bumped on every new game so practice mode reshuffles. */
  const [runId, setRunId] = useState(0)

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
    // since before midnight in Singapore - that is a different puzzle now.
    const date = getPuzzleDate()
    setPuzzleDate(date)
    setSaved(loadResult(date))
    setRunId((id) => id + 1)
    setLastRunScore(null)
    setPhase('countdown')
  }, [])

  const switchMode = useCallback(() => {
    setMode((m) => (m === 'daily' ? 'practice' : 'daily'))
    setAnswers([])
    setLastRunScore(null)
    setPhase('idle')
  }, [])

  const finishGame = useCallback(
    (played: Answer[]) => {
      if (isDaily) {
        // Keep whichever run is better, so a rough replay can never wipe out
        // a score the player still wanted to copy.
        const best = saveBestResult(puzzleDate, played)
        setSaved(best)
        setAnswers(best)
        setLastRunScore(played.length)
      } else {
        setAnswers(played)
        setLastRunScore(null)
      }
      setPhase('done')
    },
    [isDaily, puzzleDate],
  )

  const showSavedResult = useCallback(() => {
    if (!saved) return
    setAnswers(saved)
    setLastRunScore(null)
    setPhase('done')
  }, [saved])

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
          savedScore={isDaily && saved ? saved.length : null}
          onStart={startGame}
          onShowResult={showSavedResult}
          onSwitchMode={switchMode}
        />
      )}
      {phase === 'countdown' && <Countdown onDone={startPlaying} />}
      {phase === 'done' && (
        <Results
          stats={stats}
          puzzleNumber={puzzleNumber}
          isDaily={isDaily}
          lastRunScore={lastRunScore}
          onPlayAgain={startGame}
          onSwitchMode={switchMode}
        />
      )}
    </div>
  )
}

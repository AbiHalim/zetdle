import { useEffect } from 'react'

interface Props {
  isDaily: boolean
  puzzleNumber: number
  isTouch: boolean
  /** Score of the run already saved for today, if any. */
  savedScore: number | null
  onStart: () => void
  onShowResult: () => void
  onSwitchMode: () => void
}

export default function Start({
  isDaily,
  puzzleNumber,
  isTouch,
  savedScore,
  onStart,
  onShowResult,
  onSwitchMode,
}: Props) {
  // Any key starts the game on desktop.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'Tab') return // let people tab to the links
      onStart()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onStart])

  return (
    <main className="main" onPointerDown={onStart}>
      <h1 className="start__title">Zetdle</h1>
      <p className="start__subtitle">
        {isDaily ? (
          <>
            Puzzle #{puzzleNumber}. Everyone in the world gets the same problems
            today. 120 seconds &mdash; answer as many as you can.
          </>
        ) : (
          <>
            Practice run with random problems. Not today&rsquo;s puzzle, and not
            shareable.
          </>
        )}
      </p>
      <p className="start__cue">{isTouch ? 'Tap to start' : 'Press any key to start'}</p>
      {savedScore !== null && (
        <button
          type="button"
          className="linkbtn"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onShowResult()
          }}
        >
          See today&rsquo;s result ({savedScore})
        </button>
      )}

      <button
        type="button"
        className="linkbtn"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onSwitchMode()
        }}
      >
        {isDaily ? 'Practice with random problems' : "Back to today's Zetdle"}
      </button>
    </main>
  )
}

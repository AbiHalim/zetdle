import { useEffect, useState } from 'react'
import { copyToClipboard } from '../lib/clipboard'
import { OPERATIONS, OP_SYMBOL } from '../lib/problems'
import {
  buildShareText,
  formatSeconds,
  formatSlowest,
  type GameStats,
} from '../lib/results'

interface Props {
  stats: GameStats
  puzzleNumber: number
  isDaily: boolean
  /** Score of the round just played, or null when nothing was just played. */
  lastRunScore: number | null
  onPlayAgain: () => void
  onSwitchMode: () => void
}

export default function Results({
  stats,
  puzzleNumber,
  isDaily,
  lastRunScore,
  onPlayAgain,
  onSwitchMode,
}: Props) {
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  // Let the "Copied!" message fade away on its own.
  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

  const shareText = buildShareText(puzzleNumber, stats)
  /** A replay that did not beat the saved run leaves the best one on screen. */
  const showingBestInstead = lastRunScore !== null && lastRunScore !== stats.score

  async function handleCopy() {
    const ok = await copyToClipboard(shareText)
    setCopied(ok)
    if (!ok) window.prompt('Copy your result:', shareText)
  }

  async function handleShare() {
    try {
      await navigator.share({ text: shareText })
    } catch {
      // The player dismissed the share sheet. Nothing to do.
    }
  }

  return (
    <main className="main">
      <div className="results">
        <div>
          <div className="results__label">
            {isDaily ? `Zetdle #${puzzleNumber}` : 'Practice run'}
          </div>
          <div className="results__score">{stats.score}</div>
          <div className="results__pace">
            {formatSeconds(stats.avgSeconds)}s per correct answer
          </div>
          {showingBestInstead && (
            <div className="results__best-note">
              That run scored {lastRunScore}. Showing your best for today, which
              is what gets copied.
            </div>
          )}
        </div>

        <table className="breakdown">
          <thead>
            <tr>
              <th>Operation</th>
              <th>Answered</th>
              <th>Average</th>
            </tr>
          </thead>
          <tbody>
            {OPERATIONS.map((op) => {
              const { count, avgSeconds } = stats.perOp[op]
              return (
                <tr key={op}>
                  <td>{OP_SYMBOL[op]}</td>
                  <td className={count ? undefined : 'breakdown__none'}>{count}</td>
                  <td className={count ? undefined : 'breakdown__none'}>
                    {count ? `${formatSeconds(avgSeconds)}s` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="slowest">
          Slowest problem: <strong>{formatSlowest(stats.slowest)}</strong>
        </div>

        <div className="actions">
          {isDaily ? (
            <>
              <button type="button" className="btn btn--primary" onClick={handleCopy}>
                Copy result
              </button>
              {canShare && (
                <button type="button" className="btn" onClick={handleShare}>
                  Share
                </button>
              )}
              <div className="copied">{copied ? 'Copied!' : ''}</div>
            </>
          ) : (
            <div className="practice-note">
              This was a practice run with random problems, so there is nothing to
              share. Play today&rsquo;s Zetdle for a shareable result.
            </div>
          )}

          <button type="button" className="btn" onClick={onPlayAgain}>
            Play again
          </button>
        </div>

        <button type="button" className="linkbtn" onClick={onSwitchMode}>
          {isDaily ? 'Practice with random problems' : "Back to today's Zetdle"}
        </button>
      </div>
    </main>
  )
}

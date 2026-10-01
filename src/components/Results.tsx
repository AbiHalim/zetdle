import { useEffect, useState } from 'react'
import { copyToClipboard } from '../lib/clipboard'
import AccountPanel, { type AccountView } from './AccountPanel'
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
  account: AccountView
  onPlayAgain: () => void
  onSwitchMode: () => void
}

export default function Results({
  stats,
  puzzleNumber,
  isDaily,
  lastRunScore,
  account,
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

  // Only a signed-in player has a streak worth sharing.
  const shareText = buildShareText(puzzleNumber, stats, {
    streak: account.status === 'signed-in' ? (account.streak?.current ?? null) : null,
  })
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

        {/*
          Actions sit right under the score so they are on screen without
          scrolling: sharing first, then starting another round.
        */}
        <div className="actions">
          {isDaily && (
            <div className="actions__row">
              <button
                type="button"
                className="btn btn--primary btn--grow"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <CheckIcon />
                    Copied!
                  </>
                ) : (
                  'Copy result'
                )}
              </button>
              {canShare && (
                <button type="button" className="btn btn--tonal" onClick={handleShare}>
                  <ShareIcon />
                  Share
                </button>
              )}
            </div>
          )}

          <div className="actions__row">
            <button
              type="button"
              className={isDaily ? 'btn btn--grow' : 'btn btn--primary btn--grow'}
              onClick={onPlayAgain}
            >
              Play again
            </button>
            <button type="button" className="btn btn--grow" onClick={onSwitchMode}>
              {isDaily ? 'Practice mode' : "Today's Zetdle"}
            </button>
          </div>

          {!isDaily && (
            <p className="practice-note">
              Practice runs use random problems, so there is nothing to share.
            </p>
          )}

          {/* The button label changes too, but screen readers need telling. */}
          <span className="visually-hidden" role="status">
            {copied ? 'Result copied to clipboard' : ''}
          </span>
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

        {/* Last on the page: it is an extra, and should never outshine sharing. */}
        {isDaily && <AccountPanel account={account} />}
      </div>
    </main>
  )
}

function CheckIcon() {
  return (
    <svg className="btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

/** The familiar box-and-arrow share glyph. */
function ShareIcon() {
  return (
    <svg className="btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  )
}

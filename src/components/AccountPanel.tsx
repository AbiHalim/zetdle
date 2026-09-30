import type { ChartData } from '../lib/chart'
import { formatStreak, type StreakInfo } from '../lib/streak'
import type { AuthStatus } from '../hooks/useSession'
import ScoreChart from './ScoreChart'

/** Everything the results screen needs to know about the player's account. */
export interface AccountView {
  /** False when the site was built without Supabase credentials. */
  enabled: boolean
  status: AuthStatus
  displayName: string | null
  streak: StreakInfo | null
  allTimeHigh: number | null
  isNewHigh: boolean
  chart: ChartData | null
  todayScore: number | null
  historyFailed: boolean
  error: string | null
  onSignIn: () => void
  onSignOut: () => void
}

/**
 * Streak, personal best and progress - or an invitation to sign in.
 *
 * Everything here is an extra on top of a results screen that is already
 * complete. Whenever the account state is unknown, unavailable or broken, this
 * renders nothing at all rather than a spinner: a results screen is a moment
 * of satisfaction, and a skeleton on it is worse than a brief pop-in.
 */

/** Google's official "G", inlined so the button costs no extra request. */
function GoogleMark() {
  return (
    <svg className="btn__mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

export default function AccountPanel({ account }: { account: AccountView }) {
  if (!account.enabled) return null
  if (account.status === 'loading') return null

  if (account.status === 'signed-out') {
    return (
      <div className="account">
        <p className="account__prompt">Sign in to keep a streak and track your scores.</p>
        <button type="button" className="btn btn--google" onClick={account.onSignIn}>
          <GoogleMark />
          Sign in with Google
        </button>
        {account.error && <p className="account__error">{account.error}</p>}
      </div>
    )
  }

  const { streak, allTimeHigh, chart, todayScore } = account

  return (
    <div className="account">
      {account.isNewHigh && <p className="account__new-high">New high score!</p>}

      {streak && streak.current > 0 && (
        <p className="account__streak">
          {'\u{1F525}'} {formatStreak(streak.current)} streak
          {streak.atRisk && <span className="account__hint"> · play today to keep it</span>}
        </p>
      )}

      {/* The high score lives under the graph, so the streak sits alone up here. */}
      {chart && (
        <ScoreChart data={chart} todayScore={todayScore} highScore={allTimeHigh} />
      )}

      {account.historyFailed && (
        <p className="account__error">Couldn&rsquo;t load your history.</p>
      )}

      <button type="button" className="linkbtn" onClick={account.onSignOut}>
        Sign out{account.displayName ? ` (${account.displayName})` : ''}
      </button>
    </div>
  )
}

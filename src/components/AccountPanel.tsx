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
export default function AccountPanel({ account }: { account: AccountView }) {
  if (!account.enabled) return null
  if (account.status === 'loading') return null

  if (account.status === 'signed-out') {
    return (
      <div className="account">
        <p className="account__prompt">Sign in to keep a streak and track your scores.</p>
        <button type="button" className="btn" onClick={account.onSignIn}>
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

      <div className="account__stats">
        {streak && streak.current > 0 && (
          <span className="account__stat">
            {'\u{1F525}'} {formatStreak(streak.current)} streak
            {streak.atRisk && <span className="account__hint"> · play today to keep it</span>}
          </span>
        )}
        {allTimeHigh !== null && (
          <span className="account__stat">Best ever {allTimeHigh}</span>
        )}
      </div>

      {chart && <ScoreChart data={chart} todayScore={todayScore} />}

      {account.historyFailed && (
        <p className="account__error">Couldn&rsquo;t load your history.</p>
      )}

      <button type="button" className="linkbtn" onClick={account.onSignOut}>
        Sign out{account.displayName ? ` (${account.displayName})` : ''}
      </button>
    </div>
  )
}

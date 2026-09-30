import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { AUTH_TIMEOUT_MS } from '../config'
import { accountsEnabled, supabase } from '../lib/supabase'

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'

/** What the app knows about the signed-in player. */
export interface AccountUser {
  id: string
  email: string | null
  name: string | null
}

export interface SessionState {
  /** False when the site was built without Supabase credentials. */
  enabled: boolean
  status: AuthStatus
  user: AccountUser | null
  error: string | null
  signIn: () => void
  signOut: () => void
}

/** Keep Supabase's own types out of the components. */
function toAccountUser(user: User): AccountUser {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  const named = [metadata.full_name, metadata.name].find(
    (value): value is string => typeof value === 'string' && value.trim() !== '',
  )

  return { id: user.id, email: user.email ?? null, name: named ?? null }
}

export function useSession(): SessionState {
  // With no credentials there is nothing to wait for, so we never even pass
  // through 'loading' - the signed-out app must render immediately.
  const [status, setStatus] = useState<AuthStatus>(
    accountsEnabled ? 'loading' : 'signed-out',
  )
  const [user, setUser] = useState<AccountUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return

    let settled = false

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // This must stay synchronous. It runs while the auth lock is held, and
      // awaiting another SDK call in here can deadlock. Fetching happens in
      // its own effect, keyed on the user id.
      settled = true
      const nextUser = session?.user ? toAccountUser(session.user) : null
      setUser(nextUser)
      setStatus(nextUser ? 'signed-in' : 'signed-out')
    })

    // supabase-js fires INITIAL_SESSION on subscribe. If it somehow never
    // arrives - paused project, offline, a hung refresh - fall back to signed
    // out rather than leaving the screen stuck.
    const timer = setTimeout(() => {
      if (!settled) setStatus('signed-out')
    }, AUTH_TIMEOUT_MS)

    return () => {
      clearTimeout(timer)
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(() => {
    if (!supabase) return
    setError(null)

    // Origin with no path: a static deploy has no /callback route, and the
    // origin is the one value that is right on localhost, previews and prod.
    supabase.auth
      .signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      .then(({ error: signInError }) => {
        if (signInError) setError('Could not start sign-in. Try again?')
      })
      .catch(() => setError('Could not start sign-in. Try again?'))
  }, [])

  const signOut = useCallback(() => {
    if (!supabase) return
    setError(null)
    supabase.auth.signOut().catch(() => setError('Could not sign out.'))
  }, [])

  return { enabled: accountsEnabled, status, user, error, signIn, signOut }
}

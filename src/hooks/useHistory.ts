import { useCallback, useEffect, useState } from 'react'
import { fetchHistory, syncTodayIfNeeded } from '../lib/history'
import type { PlayedDay } from '../lib/streak'

export type HistoryStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface HistoryState {
  status: HistoryStatus
  /** Oldest first. */
  days: PlayedDay[]
  /** Fold a just-saved day in without another round trip. */
  applyDay: (day: PlayedDay) => void
}

function mergeDay(days: PlayedDay[], day: PlayedDay): PlayedDay[] {
  return [...days.filter((existing) => existing.date !== day.date), day].sort((a, b) =>
    a.date.localeCompare(b.date),
  )
}

/**
 * A player's history, fetched once per sign-in.
 *
 * This belongs in App, not in the results screen: Results unmounts on every
 * new round, so a hook living there would refetch each time the player
 * finished a game.
 */
export function useHistory(userId: string | null, puzzleDate: string): HistoryState {
  const [status, setStatus] = useState<HistoryStatus>('idle')
  const [days, setDays] = useState<PlayedDay[]>([])

  useEffect(() => {
    if (!userId) {
      setStatus('idle')
      setDays([])
      return
    }

    // A fast sign-out then sign-in must not let a stale response land.
    let cancelled = false
    setStatus('loading')

    void (async () => {
      const loaded = await fetchHistory(userId)
      if (cancelled) return

      if (!loaded) {
        setStatus('error')
        return
      }

      setDays(loaded)
      setStatus('ready')

      const synced = await syncTodayIfNeeded(userId, puzzleDate, loaded)
      if (!cancelled && synced) setDays((prev) => mergeDay(prev, synced))
    })()

    return () => {
      cancelled = true
    }
  }, [userId, puzzleDate])

  const applyDay = useCallback((day: PlayedDay) => {
    setDays((prev) => mergeDay(prev, day))
  }, [])

  return { status, days, applyDay }
}

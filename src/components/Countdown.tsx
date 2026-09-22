import { useEffect, useState } from 'react'
import { COUNTDOWN_SECONDS } from '../config'

interface Props {
  onDone: () => void
}

/** The 3 - 2 - 1 before the timer starts. */
export default function Countdown({ onDone }: Props) {
  const [count, setCount] = useState(COUNTDOWN_SECONDS)

  useEffect(() => {
    if (count <= 0) {
      onDone()
      return
    }
    const id = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [count, onDone])

  return (
    <main className="main">
      <div className="countdown" aria-live="assertive">
        {count > 0 ? count : 'Go'}
      </div>
    </main>
  )
}

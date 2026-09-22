interface Props {
  title: string
  /** Seconds remaining. */
  seconds: number
}

/** "1:58" from 118 seconds. Always rounds up, so it ends on 0:00. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds))
  const mins = Math.floor(total / 60)
  return `${mins}:${String(total - mins * 60).padStart(2, '0')}`
}

export default function TopBar({ title, seconds }: Props) {
  return (
    <header className="topbar">
      <span className="topbar__title">{title}</span>
      <span className={`topbar__timer${seconds <= 10 ? ' topbar__timer--low' : ''}`}>
        {formatClock(seconds)}
      </span>
    </header>
  )
}

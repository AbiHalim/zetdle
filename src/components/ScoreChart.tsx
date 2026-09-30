import { formatShortDate, type ChartData } from '../lib/chart'

interface Props {
  data: ChartData
  /** Today's score. Null when today has not been played. */
  todayScore: number | null
  /**
   * The all-time best, which is not the same as the best in `data` - a
   * personal best older than the chart window still counts.
   */
  highScore: number | null
}

// The drawing area inside the viewBox. Left padding leaves room for the y
// labels, bottom padding for the two date labels.
const VIEW_WIDTH = 320
const VIEW_HEIGHT = 120
const PAD_LEFT = 26
const PAD_RIGHT = 6
const PAD_TOP = 8
const PAD_BOTTOM = 16

const PLOT_WIDTH = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT
const PLOT_HEIGHT = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM
const BASELINE = PAD_TOP + PLOT_HEIGHT

/**
 * Daily score over the last month, as a hand-rolled SVG.
 *
 * All the arithmetic worth testing lives in lib/chart.ts; this only turns
 * domain values into coordinates. There is deliberately no hover or tooltip:
 * most people play on a phone, where hover does not exist, so the numbers
 * worth knowing are printed in the caption underneath instead.
 */
export default function ScoreChart({ data, todayScore, highScore }: Props) {
  const { points, runs, windowStart, windowDays, yMax } = data

  if (points.length === 0) {
    return (
      <p className="chart__empty">
        Play a few days and your scores show up here.
      </p>
    )
  }

  const x = (dayIndex: number) =>
    PAD_LEFT + (dayIndex / (windowDays - 1)) * PLOT_WIDTH
  const y = (score: number) => BASELINE - (score / yMax) * PLOT_HEIGHT

  const gridLines = [0, yMax / 2, yMax]
  const summary = `Daily score over the last ${windowDays} days. High score ${
    highScore ?? 'none yet'
  }${todayScore === null ? '' : `, today ${todayScore}`}.`

  return (
    <figure className="chart">
      <svg
        className="chart__svg"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={summary}
      >
        <title>{summary}</title>

        {gridLines.map((value) => (
          <g key={value}>
            <line
              x1={PAD_LEFT}
              x2={VIEW_WIDTH - PAD_RIGHT}
              y1={y(value)}
              y2={y(value)}
              className="chart__grid"
            />
            <text x={PAD_LEFT - 6} y={y(value) + 3} className="chart__label" textAnchor="end">
              {value}
            </text>
          </g>
        ))}

        {/* One line per unbroken run of days, so a gap in play leaves a gap. */}
        {runs
          .filter((run) => run.length > 1)
          .map((run) => (
            <polyline
              key={run[0].date}
              className="chart__line"
              points={run.map((p) => `${x(p.dayIndex)},${y(p.score)}`).join(' ')}
            />
          ))}

        {/* A lone day has no line to sit on, and today is worth pointing out. */}
        {points
          .filter((p) => p.isToday || runs.some((run) => run.length === 1 && run[0] === p))
          .map((p) => (
            <circle
              key={p.date}
              cx={x(p.dayIndex)}
              cy={y(p.score)}
              r={4}
              className={`chart__dot${p.isToday ? ' chart__dot--today' : ''}`}
            />
          ))}

        <text x={PAD_LEFT} y={VIEW_HEIGHT - 3} className="chart__label" textAnchor="start">
          {formatShortDate(windowStart)}
        </text>
        <text
          x={VIEW_WIDTH - PAD_RIGHT}
          y={VIEW_HEIGHT - 3}
          className="chart__label"
          textAnchor="end"
        >
          Today
        </text>
      </svg>

      {highScore !== null && (
        <figcaption className="chart__caption">High Score: {highScore}</figcaption>
      )}
    </figure>
  )
}

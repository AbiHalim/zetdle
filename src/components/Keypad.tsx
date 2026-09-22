interface Props {
  onDigit: (digit: string) => void
  onBackspace: () => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * On-screen keypad for touch devices. We deliberately do not use a real
 * <input>, so the phone's own keyboard never opens and the page never jumps.
 */
export default function Keypad({ onDigit, onBackspace }: Props) {
  return (
    <div className="keypad">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          className="keypad__key"
          aria-label={key}
          onPointerDown={(e) => {
            e.preventDefault()
            onDigit(key)
          }}
        >
          {key}
        </button>
      ))}
      <button
        type="button"
        className="keypad__key keypad__key--wide"
        aria-label="0"
        onPointerDown={(e) => {
          e.preventDefault()
          onDigit('0')
        }}
      >
        0
      </button>
      <button
        type="button"
        className="keypad__key"
        aria-label="Backspace"
        onPointerDown={(e) => {
          e.preventDefault()
          onBackspace()
        }}
      >
        &#9003;
      </button>
    </div>
  )
}

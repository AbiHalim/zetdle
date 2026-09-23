import { useEffect, useState } from 'react'
import { CHEAT_IMAGE_URL } from '../config'

interface Props {
  onDismiss: () => void
}

/**
 * What a script gets instead of a score.
 *
 * Dismissing is deliberately click-only and armed after a short delay: the
 * script that triggered this is probably still hammering the keyboard, and it
 * would be a shame for it to close its own prize before anyone saw it.
 */
export default function NiceTry({ onDismiss }: Props) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setArmed(true), 1000)
    return () => clearTimeout(id)
  }, [])

  return (
    <div
      className="nicetry"
      onPointerDown={() => {
        if (armed) onDismiss()
      }}
    >
      <img className="nicetry__img" src={CHEAT_IMAGE_URL} alt="Nice try" />
    </div>
  )
}

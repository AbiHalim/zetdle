import { CHEAT_IMAGE_URL } from '../config'

/**
 * What a script gets instead of a score.
 *
 * There is deliberately no way out of this screen: no button, no click to
 * dismiss, no key press. Reloading the page is the only escape, which is the
 * whole joke.
 */
export default function NiceTry() {
  return (
    <div className="nicetry">
      <img className="nicetry__img" src={CHEAT_IMAGE_URL} alt="Nice try" />
    </div>
  )
}

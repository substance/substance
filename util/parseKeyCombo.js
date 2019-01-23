import platform from './platform'
import keys from './keys'

/**
 * Parses a key-combo such as 'CommandOrControl+Enter' and turns it into a
 * record equivalent to a DOM KeyboardEvent.
 *
 * @param {string} combo a key-combo such as 'CommandOrControl+Enter'
 */
export default function parseKeyCombo (combo) {
  let frags = combo.split('+')
  let keyEvent = {
    keyCode: -1
  }
  for (var i = 0; i < frags.length; i++) {
    let frag = frags[i].toUpperCase()
    switch (frag) {
      case 'ALT': {
        keyEvent.altKey = true
        break
      }
      case 'ALTGR': {
        keyEvent.altKey = true
        keyEvent.code = 'AltRight'
        break
      }
      case 'CMD': {
        keyEvent.metaKey = true
        break
      }
      case 'CTRL': {
        keyEvent.ctrlKey = true
        break
      }
      case 'COMMANDORCONTROL': {
        if (platform.isMac) {
          keyEvent.metaKey = true
        } else {
          keyEvent.ctrlKey = true
        }
        break
      }
      case 'MEDIANEXTTRACK': {
        keyEvent.code = 'MediaTrackNext'
        break
      }
      case 'MEDIAPLAYPAUSE': {
        keyEvent.code = 'MediaPlayPause'
        break
      }
      case 'MEDIAPREVIOUSTRACK': {
        keyEvent.code = 'MediaPreviousTrack'
        break
      }
      case 'MEDIASTOP': {
        keyEvent.code = 'MediaStop'
        break
      }
      case 'SHIFT': {
        keyEvent.shiftKey = true
        break
      }
      case 'SUPER': {
        keyEvent.metaKey = true
        break
      }
      default:
        if (frag.length === 1) {
          keyEvent.keyCode = frag.charCodeAt(0)
        } else if (keys.hasOwnProperty(frag)) {
          keyEvent.keyCode = keys[frag]
        } else {
          throw new Error('Unsupported keyboard command: ' + combo)
        }
    }
  }
  return keyEvent
}

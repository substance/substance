import platform from './platform'
import parseKeyEvent from './parseKeyEvent'
import keys from './keys'

export default function parseKeyCombo (combo) {
  let frags = combo.split('+')
  let data = {
    keyCode: -1
  }
  for (var i = 0; i < frags.length; i++) {
    let frag = frags[i].toUpperCase()
    switch (frag) {
      case 'ALT': {
        data.altKey = true
        break
      }
      case 'ALTGR': {
        data.altKey = true
        data.code = 'AltRight'
        break
      }
      case 'CMD': {
        data.metaKey = true
        break
      }
      case 'CTRL': {
        data.ctrlKey = true
        break
      }
      case 'COMMANDORCONTROL': {
        if (platform.isMac) {
          data.metaKey = true
        } else {
          data.ctrlKey = true
        }
        break
      }
      case 'MEDIANEXTTRACK': {
        data.code = 'MediaTrackNext'
        break
      }
      case 'MEDIAPLAYPAUSE': {
        data.code = 'MediaPlayPause'
        break
      }
      case 'MEDIAPREVIOUSTRACK': {
        data.code = 'MediaPreviousTrack'
        break
      }
      case 'MEDIASTOP': {
        data.code = 'MediaStop'
        break
      }
      case 'SHIFT': {
        data.shiftKey = true
        break
      }
      case 'SUPER': {
        data.metaKey = true
        break
      }
      default:
        if (frag.length === 1) {
          data.keyCode = frag.charCodeAt(0)
        } else if (keys.hasOwnProperty(frag)) {
          data.keyCode = keys[frag]
        } else {
          throw new Error('Unsupported keyboard command: ' + combo)
        }
    }
  }
  return parseKeyEvent(data)
}

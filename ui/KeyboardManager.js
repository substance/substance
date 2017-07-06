import { keys, parseKeyEvent, platform } from '../util'
import ExecuteCommandHandler from './ExecuteCommandHandler'

class KeyboardManager {

  constructor(editorSession, bindings, options) {
    this.editorSession = editorSession
    this.context = options.context || {}
    this.keydownBindings = {}
    this.textinputBindings = {}

    bindings.forEach(({ key, spec }) => {
      // default combos are evaluated on keydown
      let type = spec.type || 'keydown'
      if(spec.command) {
        let handler = new ExecuteCommandHandler(editorSession, spec.command)
        let hook = handler.execute.bind(handler)
        if (type === 'keydown') {
          this.keydownBindings[parseCombo(key)] = hook
        } else if (type === 'textinput') {
          this.textinputBindings[key] = hook
        }
      } else {
        throw new Error('Keyboard binding not supported', spec)
      }
    })
  }

  onKeydown(event) {
    let key = parseKeyEvent(event)
    let hook = this.keydownBindings[key]
    if (hook) {
      let params = this._getParams()
      const hasExecuted = hook(params, this.context)
      if (hasExecuted) {
        event.preventDefault()
        event.stopPropagation()
      }
      return hasExecuted
    }
  }


  onTextInput(text) {
    let hook = this.textinputBindings[text]
    if (hook) {
      let params = this._getParams()
      return hook(params, this.context)
    }
  }

  _getParams() {
    let editorSession = this.editorSession
    let selectionState = editorSession.getSelectionState()
    let sel = selectionState.getSelection()
    let surface = this.context.surfaceManager.getFocusedSurface()
    return {
      editorSession: editorSession,
      selectionState: selectionState,
      surface: surface,
      selection: sel,
    }
  }

}

function parseCombo(combo) {
  let frags = combo.split('+')
  let data = {
    keyCode: -1
  }
  for (var i = 0; i < frags.length; i++) {
    let frag = frags[i].toUpperCase()
    switch(frag) {
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
      default:
        if (frag.length === 1) {
          data.keyCode = frag.charCodeAt(0)
        } else if (keys.hasOwnProperty(frag)) {
          data.keyCode = keys[frag]
        } else {
          throw new Error('Unsupported keyboard command: '+ combo)
        }
    }
  }
  return parseKeyEvent(data)
}

KeyboardManager.parseCombo = parseCombo

export default KeyboardManager

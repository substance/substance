import forEach from '../util/forEach'
import keys from '../util/keys'
import ExecuteCommandHandler from './ExecuteCommandHandler'

class KeyboardManager {

  constructor(editorSession, bindings, options) {
    this.editorSession = editorSession

    this.context = options.context || {}

    this.bindings = {}
    forEach(bindings, (spec, combo) => {
      if(spec.command) {
        let handler = new ExecuteCommandHandler(editorSession, spec.command)
        this.bindings[combo] = {
          fn: handler.execute,
          owner: handler
        }
      } else {
        throw new Error('Keyboard binding not supported', spec)
      }
    })
  }

  onKeydown(event) {
    let key = generateKey(event)
    let handler = this.bindings[key]
    if (handler) {
      event.preventDefault()
      event.stopPropagation()
      let params = this._getParams()
      handler.fn.call(handler.owner, params, this.context)
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

// transforms a string like 'cmd+a' into an internal normalized representation

function generateKey(event) {
  let frags = []
  if (event.altKey) {
    if (event.code === 'AltRight') {
      frags.push('ALTGR')
    } else {
      frags.push('ALT')
    }
  }
  if (event.ctrlKey) frags.push('CTRL')
  if (event.metaKey) frags.push('META')
  if (event.shiftKey) frags.push('SHIFT')
  frags.push(event.keyCode)
  return frags.join('+')
}

KeyboardManager.parseCombo = function parseCombo(combo) {
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
  return generateKey(data)
}

export default KeyboardManager

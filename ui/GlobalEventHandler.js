/*
  Experimental

  We are seeking for a solution providing access to global DOM events
  while considering the current app state ~ document session state.

  This implementation is just a prototype and might change with the next releases.
*/

import inBrowser from '../util/inBrowser'
import DOMElement from '../dom/DOMElement'
import DOMEventListener from '../dom/DOMEventListener'
import DefaultDOMElement from '../dom/DefaultDOMElement'

/*
  TODO: to be 100% safe we would need to introduce a hidden contenteditable
  where we put the selection in case of non-surface situations
  so that we are still able to receive events such as 'copy' -- actually only Edge is not dispatching
  to window.document.
*/

const events = [ 'keydown', 'keyup', 'keypress', 'mousedown', 'mouseup' , 'copy']

class GlobalEventHandler {

  constructor(editorSession, surfaceManager) {
    this.editorSession = editorSession
    this.surfaceManager = surfaceManager
    this.listeners = []
    this.initialize()
  }

  initialize() {
    if (inBrowser) {
      let document = DefaultDOMElement.wrapNativeElement(window.document)
      events.forEach(function(name) {
        document.on(name, this._dispatch.bind(this, name), this)
      }.bind(this))
    }
  }

  dispose() {
    if (inBrowser) {
      let document = DefaultDOMElement.wrapNativeElement(window.document)
      document.off(this)
    }
  }

  addEventListener(eventName, handler, options) {
    if (!options.id) {
      throw new Error("GlobalEventHandler can only be used with option 'id'")
    }
    let listener = new DOMEventListener(eventName, handler, options)
    this.listeners.push(listener)
  }

  removeEventListener(listener) {
    let idx = this.listeners.indexOf(listener);
    if (idx > -1) {
      this.listeners.splice(idx, 1)
    }
  }

  getEventListeners() {
    return this.listeners
  }

  _getActiveListener(eventName) {
    let editorSession = this.editorSession
    let sel = editorSession.getSelection()
    if (sel) {
      let surfaceId = sel.surfaceId
      for (let i = 0; i < this.listeners.length; i++) {
        let listener = this.listeners[i]
        if (listener.eventName === eventName && listener.options.id === surfaceId) {
          return listener
        }
      }
    }
  }

  _dispatch(eventName, e) {
    let listener = this._getActiveListener(eventName)
    if (listener) {
      listener.handler(e)
    }
  }
}

GlobalEventHandler.prototype.on = DOMElement.prototype.on
GlobalEventHandler.prototype.off = DOMElement.prototype.off

export default GlobalEventHandler

/*
  Experimental

  We are seeking for a solution providing access to global DOM events
  while considering the current app state ~ document session state.

  This implementation is just a prototype and might change with the next releases.
*/

import DOMElement from '../dom/DOMElement'
import DOMEventListener from '../dom/DOMEventListener'
import DefaultDOMElement from '../dom/DefaultDOMElement'
import platform from '../util/platform'

/*
  TODO: to be 100% safe we would need to introduce a hidden contenteditable
  where we put the selection in case of non-surface situations
  so that we are still able to receive events such as 'copy' -- actually only Edge is not dispatching
  to window.document.
*/

const events = [ 'keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'copy' ]

export default class GlobalEventHandler {
  constructor (editorSession) {
    this.editorSession = editorSession
    this.listeners = []
    this.initialize()
  }

  initialize () {
    if (platform.inBrowser) {
      let document = DefaultDOMElement.wrapNativeElement(window.document)
      events.forEach(function (name) {
        document.on(name, this._dispatch.bind(this, name), this)
      }.bind(this))
    }
  }

  dispose () {
    if (platform.inBrowser) {
      let document = DefaultDOMElement.wrapNativeElement(window.document)
      document.off(this)
    }
  }

  addEventListener (eventName, handler, options) {
    if (!options.id) {
      throw new Error("GlobalEventHandler can only be used with option 'id'")
    }
    let listener = new DOMEventListener(eventName, handler, options)
    this.listeners.push(listener)
  }

  removeEventListener (listener) {
    let idx = this.listeners.indexOf(listener)
    if (idx > -1) {
      this.listeners.splice(idx, 1)
    }
  }

  getEventListeners () {
    return this.listeners
  }

  _getActiveListener (eventName) {
    const editorSession = this.editorSession
    const sel = editorSession.getSelection()
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

  _dispatch (eventName, e) {
    const listener = this._getActiveListener(eventName)
    if (listener) {
      listener.handler(e)
    }
  }

  on (...args) {
    return DOMElement.prototype.on.apply(this, args)
  }

  off (...args) {
    return DOMElement.prototype.off.apply(this, args)
  }
}

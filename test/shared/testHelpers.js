import { platform, DefaultDOMElement as DOM, DefaultDOMElement } from 'substance'

export function getMountPoint (t) {
  if (platform.inBrowser) {
    if (t.sandbox) {
      // ATTENTION: we can not use substanceTest.getMountPount()
      // because we have use a different DOMElement implementation here.
      // thus we take the native element of t.sandbox (which is created using substanceTest's internal substance impl)
      // and wrap it using the correct DOM implementation
      let el = DefaultDOMElement.wrap(window.document).createElement('div')
      DefaultDOMElement.wrap(t.sandbox.getNativeElement()).append(el)
      return el
    } else {
      let bodyEl = DOM.wrap(window.document.body)
      let sandboxEl = bodyEl.createElement('div')
      bodyEl.append(sandboxEl)
      return sandboxEl
    }
  } else {
    // otherwise we create a detached DOM
    let htmlDoc = DOM.parseHTML('<html><body></body></html>')
    return htmlDoc.find('body')
  }
}

export class DOMEvent {
  constructor (props) {
    Object.assign(this, props)
  }
  stopPropagation () {}
  preventDefault () {}
}

export class ClipboardEventData {
  constructor () {
    this.data = {}
  }

  getData (format) {
    return this.data[format]
  }

  setData (format, data) {
    this.data[format] = data
  }

  get types () {
    return Object.keys(this.data)
  }
}

export class ClipboardEvent {
  constructor () {
    this.clipboardData = new ClipboardEventData()
  }
  preventDefault () {}
  stopPropagation () {}
}

export function createSurfaceEvent (surface, eventData) {
  return new DOMEvent(Object.assign({ target: surface.getNativeElement() }, eventData))
}

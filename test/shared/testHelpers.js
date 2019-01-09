import { platform, DefaultDOMElement as DOM } from 'substance'

// ATTENTION: have to use a custom getMountPoint because
// during the tests are change the behavior of platform and DefaultDOMElement
export function getMountPoint (t) {
  if (platform.inBrowser) {
    if (t.sandbox) {
      let el = t.sandbox.createElement('div')
      t.sandbox.append(el)
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

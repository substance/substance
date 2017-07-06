/**
  @module

  Platform utilities such as browser detection etc.

  @example

  ```js
  import platform from 'substance/util/platform'
  ```
*/
const platform = {

  inBrowser: false,

  inNodeJS: false,

  inElectron: false,

  /**
    True if user agent is Internet Explorer or Microsoft Edge.
  */
  isIE: false,
  /**
    True if user agent is Firefox
  */

  isFF: false,

  isWebkit: false,

  /*
    Major version

    ATTENTION: at the moment only extracted for IE
  */
  version: -1,

  // TODO: make sure that this is implemented correctly

  isWindows: false,

  isMac: false,

  // in tests we change the state of this to emulate execuatio under certain conditions
  // to reset to defaults we call this function
  _reset: detect
}

function detect() {

  if (typeof window !== 'undefined') {
    platform.inBrowser = true

    // Detect Internet Explorer / Edge
    const ua = window.navigator.userAgent
    const msie = ua.indexOf('MSIE ')
    const trident = ua.indexOf('Trident/')
    const edge = ua.indexOf('Edge/')

    if (msie > 0) {
      // IE 10 or older => return version number
      platform.isIE = true
      platform.version = 10
      // TODO: if we need someday, this would be the exact version number
      // parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10)
    } else if (trident > 0) {
      // IE 11 => return version number
      platform.isIE = true
      platform.version = 11
      platform.isTrident = true
      // TODO: if we need someday, this would be the exact version number
      // var rv = ua.indexOf('rv:')
      // parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10)
    } else if (edge > 0) {
      // IE 12 => return version number
      platform.isIE = true
      platform.isEdge = true
      platform.version = 12
      // TODO: if we need someday, this would be the exact version number
      parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10)
    }

    // Detect Firefox
    platform.isFF = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1

    // TODO: explicit detection of Webkit&/Blink
    platform.isWebkit = !platform.isFF && !platform.isIE
  } else {
    platform.inBrowser = false
  }

  if (platform.inBrowser) {
    platform.isWindows = (window.navigator !== undefined && window.navigator.appVersion && window.navigator.appVersion.indexOf("Win") !== -1)
    platform.isMac = (window.navigator !== undefined && window.navigator.platform.indexOf('Mac') >= 0)
  }

  // TOOD: is there a more reliable way to detect NodeJS?
  if (typeof process !== 'undefined') {
    if (platform.inBrowser) {
      platform.inElectron = true
    } else {
      platform.inNodeJS = true
    }
  }

}

detect()

export default platform
class Platform {
  constructor () {
    // lazily initialized
    this._values = null
  }

  get values () {
    if (!this._values) {
      this._values = detect()
    }
    return this._values
  }

  get isWindows () {
    return this.values.isWindows
  }

  get isMac () {
    return this.values.isMac
  }

  get inBrowser () {
    return this.values.inBrowser
  }

  get inNodeJS () {
    return this.values.inNodeJS
  }

  get inElectron () {
    return this.values.inElectron
  }

  get isIE () {
    return this.values.isIE
  }

  get isFF () {
    return this.values.isFF
  }

  get isOpera () {
    return this.values.isOpera
  }

  get isWebkit () {
    return this.values.isWebkit
  }

  get isChromium () {
    return this.values.isChromium
  }

  get devtools () {
    return this.values.devtools
  }

  get version () {
    return this.values.version
  }

  _reset () {
    this._values = detect()
  }
}

function detect () {
  let values = {}
  if (typeof window !== 'undefined') {
    values.inBrowser = true

    // Detect Internet Explorer / Edge
    const ua = window.navigator.userAgent
    const vn = window.navigator.vendor
    const msie = ua.indexOf('MSIE ')
    const trident = ua.indexOf('Trident/')
    const edge = ua.indexOf('Edge/')
    const opera = window.opr
    const chrome = window.chrome

    if (msie > 0) {
      // IE 10 or older => return version number
      values.isIE = true
      values.version = 10
      // TODO: if we need someday, this would be the exact version number
      // parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10)
    } else if (trident > 0) {
      // IE 11 => return version number
      values.isIE = true
      values.version = 11
      values.isTrident = true
      // TODO: if we need someday, this would be the exact version number
      // var rv = ua.indexOf('rv:')
      // parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10)
    } else if (edge > 0) {
      // IE 12 => return version number
      values.isIE = true
      values.isEdge = true
      values.version = 12
      // TODO: if we need someday, this would be the exact version number
      parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10)
    }

    // Detect Firefox
    values.isFF = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1

    // TODO: explicit detection of Webkit&/Blink
    values.isWebkit = !values.isFF && !values.isIE

    // Detect Opera
    values.isOpera = typeof opera !== 'undefined'

    // Detect Chromium
    values.isChromium = !!chrome && vn === 'Google Inc.' && !values.isOpera && !values.isEdge
  } else {
    values.inBrowser = false
  }

  if (values.inBrowser) {
    values.isWindows = (window.navigator !== undefined && window.navigator.appVersion && window.navigator.appVersion.indexOf('Win') !== -1)
    values.isMac = (window.navigator !== undefined && window.navigator.platform.indexOf('Mac') >= 0)
  }

  let _inNodeJS = (typeof process !== 'undefined' && process.release && process.release.name === 'node')
  if (_inNodeJS) {
    if (values.inBrowser) {
      values.inElectron = true
    } else {
      values.inNodeJS = true
    }
  }
  return values
}

export default new Platform()

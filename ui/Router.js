import forEach from '../util/forEach'
import EventEmitter from '../util/EventEmitter'
import DefaultDOMElement from '../dom/DefaultDOMElement'

class Router extends EventEmitter {
  constructor(...args) {
    super(...args)
    this.__isStarted__ = false
  }

  /*
    Starts listening for hash-changes
  */
  start() {
    let window = DefaultDOMElement.getBrowserWindow()
    window.on('hashchange', this._onHashChange, this)
    this.__isStarted__ = true
  }

  /*
    Reads out the current route
  */
  readRoute() {
    if (!this.__isStarted__) this.start()
    return this.parseRoute(this.getRouteString())
  }

  /*
    Writes out a given route as a string url
  */
  writeRoute(route, opts) {
    opts = opts || {}
    let routeString = this.stringifyRoute(route)
    if (!routeString) {
      this.clearRoute(opts);
    } else {
      this._writeRoute(routeString, opts);
    }
  }

  dispose() {
    let window = DefaultDOMElement.getBrowserWindow()
    window.off(this)
  }

  /*
    Maps a route URL to a route object

    @abstract
    @param String route content of the URL's hash fragment
  */
  parseRoute(routeString) {
    return Router.routeStringToObject(routeString)
  }

  /*
    Maps a route object to a route URL

    This can be overriden by an application specific router.

    @abstract
  */
  stringifyRoute(route) {
    return Router.objectToRouteString(route)
  }

  getRouteString() {
    return window.location.hash.slice(1)
  }

  _writeRoute(route, opts) {
    this.__isSaving__ = true
    try {
      if (opts.replace) {
        window.history.replaceState({} , '', '#'+route)
      } else {
        window.history.pushState({} , '', '#'+route)
      }
    } finally {
      this.__isSaving__ = false
    }
  }

  clearRoute(opts) {
    this._writeRoute('', opts)
  }

  _onHashChange() {
    // console.log('_onHashChange');
    if (this.__isSaving__) {
      return
    }
    if (this.__isLoading__) {
      console.error('FIXME: router is currently applying a route.')
      return
    }
    this.__isLoading__ = true;
    try {
      let routeString = this.getRouteString()
      let route = this.parseRoute(routeString)
      this.emit('route:changed', route)
    } finally {
      this.__isLoading__ = false
    }
  }

}

Router.objectToRouteString = function(obj) {
  let route = []
  forEach(obj, function(val, key) {
    route.push(key+'='+val)
  })
  return route.join(',')
}

Router.routeStringToObject = function(routeStr) {
  let obj = {};
  // Empty route maps to empty route object
  if (!routeStr) return obj
  let params = routeStr.split(',')
  params.forEach(function(param) {
    let tuple = param.split('=')
    if (tuple.length !== 2) {
      throw new Error('Illegal route.')
    }
    obj[tuple[0].trim()] = tuple[1].trim()
  })
  return obj
}

export default Router

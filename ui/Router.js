'use strict';

import each from 'lodash/each'
import EventEmitter from '../util/EventEmitter'
import DefaultDOMElement from './DefaultDOMElement'

function Router() {
  EventEmitter.apply(this, arguments);
  this.__isStarted__ = false;
}

Router.Prototype = function() {

  /*
    Starts listening for hash-changes
  */
  this.start = function() {
    var window = DefaultDOMElement.getBrowserWindow();
    window.on('hashchange', this._onHashChange, this);
    this.__isStarted__ = true;
  };

  /*
    Reads out the current route
  */
  this.readRoute = function() {
    if (!this.__isStarted__) this.start();
    return this.parseRoute(this.getRouteString());
  };

  /*
    Writes out a given route as a string url
  */
  this.writeRoute = function(route, opts) {
    opts = opts || {};
    var routeString = this.stringifyRoute(route);
    if (!routeString) {
      this.clearRoute(opts);
    } else {
      this._writeRoute(routeString, opts);
    }
  };

  this.dispose = function() {
    var window = DefaultDOMElement.getBrowserWindow();
    window.off(this);
  };

  /*
    Maps a route URL to a route object

    @abstract
    @param String route content of the URL's hash fragment
  */
  this.parseRoute = function(routeString) {
    return Router.routeStringToObject(routeString);
  };

  /*
    Maps a route object to a route URL

    This can be overriden by an application specific router.

    @abstract
  */
  this.stringifyRoute = function(route) {
    return Router.objectToRouteString(route);
  };

  this.getRouteString = function() {
    return window.location.hash.slice(1);
  };

  this._writeRoute = function(route, opts) {
    this.__isSaving__ = true;
    try {
      if (opts.replace) {
        window.history.replaceState({} , '', '#'+route);
      } else {
        window.history.pushState({} , '', '#'+route);
      }
    } finally {
      this.__isSaving__ = false;
    }
  };

  this.clearRoute = function(opts) {
    this._writeRoute('', opts);
  };

  this._onHashChange = function() {
    // console.log('_onHashChange');
    if (this.__isSaving__) {
      return;
    }
    if (this.__isLoading__) {
      console.error('FIXME: router is currently applying a route.');
      return;
    }
    this.__isLoading__ = true;
    try {
      var routeString = this.getRouteString();
      var route = this.parseRoute(routeString);
      this.emit('route:changed', route);
    } finally {
      this.__isLoading__ = false;
    }
  };

};

EventEmitter.extend(Router);

Router.objectToRouteString = function(obj) {
  var route = [];
  each(obj, function(val, key) {
    route.push(key+'='+val);
  });
  return route.join(',');
};

Router.routeStringToObject = function(routeStr) {
  var obj = {};
  // Empty route maps to empty route object
  if (!routeStr) return obj;
  var params = routeStr.split(',');
  params.forEach(function(param) {
    var tuple = param.split('=');
    if (tuple.length !== 2) {
      throw new Error('Illegal route.');
    }
    obj[tuple[0].trim()] = tuple[1].trim();
  });
  return obj;
};

export default Router;

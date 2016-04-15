'use strict';

var each = require('lodash/each');
var EventEmitter = require('../util/EventEmitter');
var DefaultDOMElement = require('./DefaultDOMElement');

var Router = function() {
  EventEmitter.apply(this, arguments);
  this.__isStarted__ = false;
};

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
    Takes the current route and updates the application state.
  */
  this.readRoute = function() {
    if (!this.__isStarted__) this.start();
    return this.deserializeRoute(this.getRoute());
  };

  this.writeRoute = function(route) {
    var routeString = this.serializeRoute(route);
    if (!routeString) {
      this.clearRoute();
    } else {
      this.setRoute(routeString);
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
  this.deserializeRoute = function(routeString) {
    /* jshint unused:false */
  };

  /*
    Maps a route object to a route URL

    This should be implemented by an application specific router.

    @abstract
   */
  this.serializeRoute = function(route) {
    /* jshint unused:false */
  };

  this.getRoute = function() {
    return window.location.hash.slice(1);
  };

  this.setRoute = function(route) {
    this.__isSaving__ = true;
    try {
      window.history.pushState({} , '', '#'+route);
    } finally {
      this.__isSaving__ = false;
    }
  };

  this.clearRoute = function() {
    this.setRoute('');
  };

  this._onHashChange = function() {
    if (this.__isSaving__) {
      return;
    }
    if (this.__isLoading__) {
      console.error('FIXME: router is currently applying a route.');
      return;
    }
    this.__isLoading__ = true;
    try {
      var routeString = this.getRoute();
      var route = this.deserializeRoute(routeString);
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

module.exports = Router;

'use strict';

// EXPERIMENTAL: rewriting ui/Router.js

var oo = require('../util/oo');
var DefaultDOMElement = require('./DefaultDOMElement');

var Router = function() {
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
  this.load = function() {
    if (!this.__isStarted__) this.start();
    this.stateFromRoute(this.getRoute());
  };

  this.dispose = function() {
    var window = DefaultDOMElement.getBrowserWindow();
    window.off(this);
  };

  /*
    Maps a route to application state and updates the application.

    This should be implemented by an application specific router.

    @abstract
    @param String route content of the URL's hash fragment
   */
  this.stateFromRoute = function(route) {
    /* jshint unused:false */
  };

  /*
    Maps an application  route to application state and updates the application.

    This should be implemented by an application specific router.

    @abstract
   */
  this.routeFromState = function() {};

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
      var route = this.getRoute();
      this.stateFromRoute(route);
    } finally {
      this.__isLoading__ = false;
    }
  };

};

oo.initClass(Router);

module.exports = Router;

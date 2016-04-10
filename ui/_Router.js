'use strict';

// EXPERIMENTAL: rewriting ui/Router.js

var oo = require('../util/oo');

var Router = function() {
  this.onHashChange = this.onHashChange.bind(this);
  window.addEventListener('hashchange', this.onHashChange);
};

Router.Prototype = function() {

  this.load = function() {
    this.stateFromRoute(this.getRoute());
  };

  this.dispose = function() {
    window.removeEventListener('hashchange', this.onHashChange);
  };

  this.onHashChange = function() {
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

  this.stateFromRoute = function() {};

  this.routeFromState = function() {};

};

oo.initClass(Router);

module.exports = Router;

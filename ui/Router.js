'use strict';

var oo = require('../util/oo');
var each = require('lodash/each');
var $ = require('../util/jquery');

var Router = function(app) {
  this.app = app;
  this.state = [];
  this.loadState();

  var self = this;
  $(window).on('hashchange', function() {
    self.onHashChange();
  });
};

Router.Prototype = function() {

  this.loadState = function() {
    var route = window.location.hash.slice(1);
    if (route) {
      var state = this.getStateFromRoute(route);
      if (state) {
        this.state = state;
      }
    }
  };

  this.getInitialState = function(component) {
    if (!component._isOnRoute) return null;
    // get router index of component
    var index = this.getRouteIndex(component);
    var state = this.state[index];
    console.log('Router: getInitialState', component, index, state);
    return state;
  };

  this.truncateState = function(component) {
    if (this.__disabled__) return;
    var index = this.getRouteIndex(component);
    this.state = this.state.slice(0, index);
  };

  this.getRouteIndex = function(component) {
    var idx = -1;
    while (component && component !== "root") {
      if (component._isOnRoute) idx++;
      component = component.getParent();
    }
    return idx;
  };

  this.updateState = function(routeState) {
    if (this.__disabled__) return;
    this.state = routeState.slice(0);
    var route = this.getRouteFromState(this.state, 'state');
    window.history.pushState({} , '', '#'+route);
  };

  this.getStateFromRoute = function(route) {
    var routeState = [];
    var stateParts = route.split(';');
    each(stateParts, function(statePart) {
      var pairs = statePart.split(',');
      var state = {};
      each(pairs, function(pair) {
        var tuple = pair.split('=');
        state[tuple[0]] = tuple[1];
      });
      routeState.push(state);
    });
    return routeState;
  };

  this.getRouteFromState = function(routeState) {
    var routeParts = [];
    each(routeState, function(state) {
      var stateParts = [];
      each(state, function(value, key) {
        // only primitives are allowed
        if (typeof value === 'object') {
          return;
        }
        stateParts.push(key + "=" + value);
      });
      routeParts.push(stateParts.join(','));
    });

    return routeParts.join(";");
  };

  this.onHashChange = function() {
    var route = window.location.hash.slice(1);
    this.state = [];
    if (route) {
      this.state = this.getStateFromRoute(route) || [];
    }
    // TODO: we need to disable router updates triggered by these updates
    // plus we need to navigave through the route and call set state on each
    // component on the route
    this.__disabled__ = true;
    var comp = this.app;
    for (var i = 0; i < this.state.length; i++) {
      var state = this.state[i];
      comp.setState(state);
      comp = comp.route;
      // if we can't set the state directly, we rely on initialization
      if (!comp) {
        break;
      }
    }
    this.__disabled__ = false;
  };

  this.isActive = function() {
    return !this.__disabled__;
  };

};

oo.initClass(Router);

module.exports = Router;

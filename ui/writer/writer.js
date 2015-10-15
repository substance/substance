'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var _ = require("../../basics/helpers");
var Controller = require('../../ui/controller');
var $$ = Component.$$;

function Writer() {
  Controller.apply(this, arguments);

  this.handleApplicationKeyCombos = this.handleApplicationKeyCombos.bind(this);

  // action handlers
  this.actions({
    "switchState": this.switchState,
    "switchContext": this.switchContext
  });
}

Writer.Prototype = function() {

  // Action handlers
  // ---------------

  // handles 'switch-state'
  this.switchState = function(newState, options) {
    options = options || {};
    this.setState(newState);
    if (options.restoreSelection) {
      this.restoreSelection();
    }
  };

  // handles 'switch-context'
  this.switchContext = function(contextId, options) {
    options = options || {};
    this.setState({ contextId: contextId });
    if (options.restoreSelection) {
      this.restoreSelection();
    }
  };

  this.restoreSelection = function() {
    var surface = this.getSurface('body');
    surface.rerenderDomSelection();
  };

  // Pass writer start
  this._panelPropsFromState = function (state) {
    var props = _.omit(state, 'contextId');
    props.doc = this.props.doc;
    return props;
  };

  this.getActivePanelElement = function() {
    var ComponentClass = this.componentRegistry.get(this.state.contextId);
    if (ComponentClass) {
      return $$(ComponentClass).setProps(this._panelPropsFromState(this.state));
    } else {
      console.warn("Could not find component for contextId:", this.state.contextId);
    }
  };

};

OO.inherit(Writer, Controller);

module.exports = Writer;

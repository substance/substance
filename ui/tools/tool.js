'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');

function Tool() {
  Component.apply(this, arguments);
}

Tool.Prototype = function() {

  this.getName = function() {
    return this.constructor.static.name;
  };

  this.isEnabled = function() {
    return !this.state.disabled;
  };

  this.isDisabled = function() {
    return this.state.disabled;
  };

  this.setEnabled = function() {
    this.setState({
      disabled: false,
      active: false
    });
  };

  this.setDisabled = function() {
    this.setState({
      disabled: true,
      active: false
    });
  };

  this.setActive = function() {
    this.setToolState({
      disabled: false,
      active: true
    });
  };

  this.getInitialState = function() {
    return {
      // we disable tools by default
      disabled: true,
      // if the tool is turned on / toggled on
      active: false
    };
  };

  this.render = function() {
    throw new Error('render is abstract.');
  };

};

OO.inherit(Tool, Component);
module.exports = Tool;

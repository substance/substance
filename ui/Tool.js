'use strict';

var oo = require('../util/oo');
var Component = require('./Component');
var _ = require('../util/helpers');
var $$ = Component.$$;

function Tool() {
  Component.apply(this, arguments);
  this.context.toolManager.registerTool(this);
}

Tool.Prototype = function() {

  this.getInitialState = function() {
    var state = this.context.toolManager.getCommandState(this);
    return state;
  };

  this.dispose = function() {
    this.context.toolManager.unregisterTool(this);
  };

  this.getController = function() {
    return this.context.controller;
  };

  this.getName = function() {
    var toolName = this.constructor.static.name;
    if (toolName) {
      return toolName;
    } else {
      throw new Error('Contract: Tool.static.name must have a value');
    }
  };

  this.onClick = function(e) {
    e.preventDefault();
    if (this.state.disabled) {
      return;
    }
    this.performAction();
  };

  this.render = function() {
    var title = this.props.title || this.i18n.t(this.getName());

    // Used only by annotation tool so far
    if (this.state.mode) {
      title = [_.capitalize(this.state.mode), title].join(' ');
    }

    var el = $$('div')
      .attr('title', title)
      .addClass('se-tool');

    el.append(
      $$("button").on('click', this.onClick)
                  .append(this.props.children)
    );

    if (this.state.disabled) {
      el.addClass('sm-disabled');
    }
    if (this.state.mode) {
      el.addClass(this.state.mode);
    }
    if (this.state.active) {
      el.addClass('sm-active');
    }

    
    return el;
  };
};

oo.inherit(Tool, Component);
module.exports = Tool;

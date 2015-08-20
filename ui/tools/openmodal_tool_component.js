"use strict";

var Substance = require('substance');
var OO = Substance.OO;
var Component = Substance.Component;
var $$ = Component.$$;

function OpenModalTool() {
  Component.apply(this, arguments);
}

OpenModalTool.Prototype = function() {

  this.getInitialState = function() {
    return { disabled: true };
  };

  this.render = function() {
    return $$('button')
      .addClass('option')
      .attr('title', this.props.title)
      .on('click', this.handleClick)
      .on('mousedown', this.handleMouseDown)
      .append(this.props.title);
  };

  this.handleClick = function(e) {
    e.preventDefault();
  };

  this.handleMouseDown = function(e) {
    e.preventDefault();
    this.send('open-modal', {
      contextId: this.props.contextId,
      itemType: this.props.itemType
    });
  };
};

OO.inherit(OpenModalTool, Component);

module.exports = OpenModalTool;

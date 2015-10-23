'use strict';

var OO = require('../basics/oo');
var Component = require('./Component');
var $$ = Component.$$;

function UnsupportedNodeComponent() {
  Component.apply(this, arguments);
}

UnsupportedNodeComponent.Prototype = function() {

  this.render = function() {
    return $$('pre')
      .addClass("content-node unsupported")
      .attr({
        "data-id": this.props.node.id,
        contentEditable: false
      })
      .append(
        JSON.stringify(this.props.node.properties, null, 2)
      );
  };
};

OO.inherit(UnsupportedNodeComponent, Component);

module.exports = UnsupportedNodeComponent;

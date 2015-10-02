'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var UnsupportedNode = require('./unsupported_node');
var $$ = Component.$$;

function IncludeComponent() {
  Component.apply(this, arguments);
}

IncludeComponent.Prototype = function() {

  this.render = function() {
    var doc = this.props.doc;
    var node = doc.get(this.props.node.nodeId);
    var ctrl = this.context.controller;    
    var ComponentClass = ctrl.getComponent(node.type);
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type);
      ComponentClass = UnsupportedNode;
    }
    return $$('div')
      .addClass("content-node include")
      .attr("data-id", this.props.node.id)
      .append($$(ComponentClass).key(node.id).addProps({ doc: doc, node: node }));
  };
};

OO.inherit(IncludeComponent, Component);

module.exports = IncludeComponent;

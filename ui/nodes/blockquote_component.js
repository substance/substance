'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var TextProperty = require('../text_property_component');

function Blockquote() {
  Component.apply(this, arguments);
}

Blockquote.Prototype = function() {

  this.getClassNames = function() {
    return "content-node blockquote";
  };

  this.render = function() {
    return $$('div')
      .addClass(this.getClassNames())
      .attr("data-id", this.props.node.id)
      .append($$(TextProperty, {
        doc: this.props.doc,
        path: [ this.props.node.id, "content"]
      }));
  };
};

OO.inherit(Blockquote, Component);

module.exports = Blockquote;
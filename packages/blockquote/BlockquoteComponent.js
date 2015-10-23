'use strict';

var OO = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var TextProperty = require('../../ui/TextPropertyComponent');

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
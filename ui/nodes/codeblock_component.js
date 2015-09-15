'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var TextProperty = require('../text_property_component');

function Codeblock() {
  Component.apply(this, arguments);
}

Codeblock.Prototype = function() {

  this.getClassNames = function() {
    return "content-node codeblock";
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

OO.inherit(Codeblock, Component);

module.exports = Codeblock;
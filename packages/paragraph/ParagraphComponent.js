'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var TextProperty = require('../../ui/TextPropertyComponent');

function ParagraphComponent() {
  Component.apply(this, arguments);
}

ParagraphComponent.Prototype = function() {

  this.getClassNames = function() {
    return "content-node paragraph";
  };

  this.render = function() {
    return $$('div')
      .addClass(this.getClassNames())
      .attr("data-id", this.props.node.id)
      .append($$(TextProperty, {
        path: [ this.props.node.id, "content"]
      }));
  };
};

oo.inherit(ParagraphComponent, Component);

module.exports = ParagraphComponent;

'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var TextProperty = require('../../ui/TextPropertyComponent');

function Codeblock() {
  Component.apply(this, arguments);
}

Codeblock.Prototype = function() {

  this.getClassNames = function() {
    return "content-node sc-codeblock";
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

oo.inherit(Codeblock, Component);

module.exports = Codeblock;
'use strict';

var Component = require('../../ui/Component');
var $$ = Component.$$;
var TextProperty = require('../../ui/TextPropertyComponent');

function Codeblock() {
  Component.apply(this, arguments);
}

Codeblock.Prototype = function() {

  this.getClassNames = function() {
    return "sc-codeblock";
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

Component.extend(Codeblock);

module.exports = Codeblock;
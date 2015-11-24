'use strict';

var Component = require('../../ui/Component');
var $$ = Component.$$;
var TextProperty = require('../../ui/TextPropertyComponent');

function Blockquote() {
  Component.apply(this, arguments);
}

Blockquote.Prototype = function() {

  this.getClassNames = function() {
    return 'sc-blockquote';
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

Component.extend(Blockquote);

module.exports = Blockquote;
'use strict';

var Component = require('./Component');
var $$ = Component.$$;
var TextProperty = require('./TextPropertyComponent');

function TextBlockComponent() {
  Component.apply(this, arguments);
}

TextBlockComponent.Prototype = function() {

  this.render = function() {
    var node = this.props.node;
    var el = $$('div')
      .addClass(this.getClassNames())
      .attr("data-id", this.props.node.id)
      .append($$(TextProperty, {
        path: [ this.props.node.id, "content"]
      }));
    if (node.direction) {
      el.attr('dir', node.direction)
    }
    return el;
  };

  this.getClassNames = function() {
    return '';
  };

};

Component.extend(TextBlockComponent);

module.exports = TextBlockComponent;

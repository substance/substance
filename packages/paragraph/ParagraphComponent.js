'use strict';

var Component = require('../../ui/Component');
var TextProperty = require('../../ui/TextPropertyComponent');

function ParagraphComponent() {
  Component.apply(this, arguments);
}

ParagraphComponent.Prototype = function() {

  this.render = function($$) {
    return $$('div')
      .addClass(this.getClassNames())
      .attr("data-id", this.props.node.id)
      .append($$(TextProperty, {
        path: [ this.props.node.id, "content"]
      }));
  };

  this.getClassNames = function() {
    return 'sc-paragraph';
  };

};

Component.extend(ParagraphComponent);

module.exports = ParagraphComponent;

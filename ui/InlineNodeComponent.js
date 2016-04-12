'use strict';

var AnnotationComponent = require('./AnnotationComponent');

function InlineNodeComponent() {
  InlineNodeComponent.super.apply(this, arguments);
}

InlineNodeComponent.Prototype = function() {

  this.render = function($$) {
    return $$('span')
      .attr({
        "data-inline": 1,
        "contentEditable": false
      });
  };
};

AnnotationComponent.extend(InlineNodeComponent);

module.exports = InlineNodeComponent;

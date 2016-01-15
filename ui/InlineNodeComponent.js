'use strict';

var AnnotationComponent = require('./AnnotationComponent');
var Component = require('./Component');
var $$ = Component.$$;

function InlineNodeComponent() {
  AnnotationComponent.apply(this, arguments);
}

InlineNodeComponent.Prototype = function() {

  this.render = function() {
    return $$('span')
      .attr({
        "data-inline": 1,
        "contentEditable": false
      });
  };
};

AnnotationComponent.extend(InlineNodeComponent);

module.exports = InlineNodeComponent;

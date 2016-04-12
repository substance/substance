'use strict';

var AnnotationComponent = require('./AnnotationComponent');

function InlineNodeComponent() {
  InlineNodeComponent.super.apply(this, arguments);
}

InlineNodeComponent.Prototype = function() {

  var _super = InlineNodeComponent.super.prototype;

  // TODO: we should avoid to have a didMount hook on an abstract base class
  this.didMount = function() {
    _super.didMount.apply(this, arguments);
  };

  // TODO: we should avoid to have a didMount hook on an abstract base class
  this.dispose = function() {
    _super.dispose.apply(this, arguments);
  };

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

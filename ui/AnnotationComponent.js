"use strict";

var Component = require('./Component');

/**
  Renders an annotation. Used internally by different components (e.g. ui/AnnotatedTextComponent)

  @class
  @component
  @extends ui/Component

  @prop {Object} doc document
  @prop {Object} node node which describes annotation

  @example

  ```js
  $$(AnnotationComponent, {
    doc: doc,
    node: node
  })
  ```
*/

function AnnotationComponent() {
  Component.apply(this, arguments);
}

AnnotationComponent.Prototype = function() {

  // TODO: we should avoid to have a didMount hook on an abstract base class
  this.didMount = function() {
    var node = this.props.node;
    node.on('highlighted', this.onHighlightedChanged, this);
  };

  // TODO: we should avoid to have a didMount hook on an abstract base class
  this.dispose = function() {
    var node = this.props.node;
    node.off(this);
  };

  this.render = function($$) {
    var el = $$('span')
      .attr("data-id", this.props.node.id)
      .addClass(this.getClassNames());
    if (this.props.node.highlighted) {
      el.addClass('sm-highlighted');
    }
    el.append(this.props.children);
    return el;
  };

  this.getClassNames = function() {
    return 'sc-'+this.props.node.type;
  };

  this.onHighlightedChanged = function() {
    if (this.props.node.highlighted) {
      this.el.addClass('sm-highlighted');
    } else {
      this.el.removeClass('sm-highlighted');
    }
  };
};

Component.extend(AnnotationComponent);

module.exports = AnnotationComponent;

"use strict";

var Component = require('./Component');
var $$ = Component.$$;

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

  this.render = function() {
    var el = $$('span')
      .attr("data-id", this.props.node.id)
      .addClass(this.getClassNames());
    if (this.props.node.highlighted) {
      el.addClass('sm-highlighted');
      // el.addClass('sm-'+this.props.node.highlightedScope);
    }
    el.append(this.props.children);
    return el;
  };

  this.getClassNames = function() {
    return 'sc-'+this.props.node.type;
  };

  this.didMount = function() {
    var node = this.props.node;
    node.on('highlighted', this.onHighlightedChanged, this);
  };

  this.dispose = function() {
    var node = this.props.node;
    node.off(this);
  };

  this.onHighlightedChanged = function() {
    if (this.props.node.highlighted) {
      this.$el.addClass('sm-highlighted');
      // this.$el.addClass('sm-'+this.props.node.highlightedScope);
    } else {
      this.$el.removeClass('sm-highlighted');
      // this.$el.removeClass('sm-'+this.props.node.highlightedScope);
    }
  };
};

Component.extend(AnnotationComponent);

module.exports = AnnotationComponent;

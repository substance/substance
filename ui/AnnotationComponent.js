"use strict";

var Component = require('./Component');
var $$ = Component.$$;

function AnnotationComponent() {
  Component.apply(this, arguments);
}

AnnotationComponent.Prototype = function() {

  this.render = function() {
    var el = $$('span')
      .attr("data-id", this.props.node.id)
      .addClass(this.getClassNames());
    if (this.props.node.highlighted) {
      el.addClass('highlighted');
    }
    el.append(this.props.children);
    return el;
  };

  this.getClassNames = function() {
    return 'sc-'+this.props.node.type;
  };

  this.didMount = function() {
    var node = this.props.node;
    node.connect(this, {
      'highlighted': this.onHighlightedChanged
    });
  };

  this.dispose = function() {
    var node = this.props.node;
    node.disconnect(this);
  };

  this.onHighlightedChanged = function() {
    if (this.props.node.highlighted) {
      this.$el.addClass('highlighted');
    } else {
      this.$el.removeClass('highlighted');
    }
  };
};

Component.extend(AnnotationComponent);

module.exports = AnnotationComponent;

"use strict";

var OO = require('../../basics/oo');
var Component = require('../component');
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
    var typeNames = this.props.node.getTypeNames();
    var classNames = typeNames.join(' ');
    if (this.props.classNames) {
      classNames += " " + this.props.classNames.join(' ');
    }
    return classNames.replace(/_/g, '-');
  };

  this.didMount = function() {
    var node = this.props.node;
    node.connect(this, {
      'highlighted': this.onHighlightedChanged
    });
  };

  this.willUnmount = function() {
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

OO.inherit(AnnotationComponent, Component);

module.exports = AnnotationComponent;

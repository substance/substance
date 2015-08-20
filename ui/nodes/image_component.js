'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;

function ImageComponent() {
  Component.apply(this, arguments);
}

ImageComponent.Prototype = function() {

  this.render = function() {
    return $$('img')
      .addClass('image')
      .attr({
        "data-id": this.props.node.id,
        contentEditable: false,
        src: this.props.node.src,
      });
  };

  this.didMount = function() {
    var doc = this.props.doc;
    doc.connect(this, { 'document:changed': this.handleDocumentChange });
  };

  this.willUnmount = function() {
    var doc = this.props.doc;
    doc.disconnect(this);
  };

  this.handleDocumentChange = function(change) {
    if (change.isAffected([this.props.node.id, "src"])) {
      this.rerender();
    }
  };
};

OO.inherit(ImageComponent, Component);

module.exports = ImageComponent;

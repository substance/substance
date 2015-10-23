'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function ImageComponent() {
  Component.apply(this, arguments);
}

ImageComponent.Prototype = function() {

  this.initialize = function() {
    var doc = this.props.doc;
    doc.connect(this, { 'document:changed': this.handleDocumentChange });
  };

  this.dispose = function() {
    var doc = this.props.doc;
    doc.disconnect(this);
  };

  this.render = function() {
    return $$('img')
      .addClass('image')
      .attr({
        "data-id": this.props.node.id,
        contentEditable: false,
        src: this.props.node.src,
      });
  };

  this.handleDocumentChange = function(change) {
    if (change.isAffected([this.props.node.id, "src"])) {
      this.rerender();
    }
  };
};

oo.inherit(ImageComponent, Component);

module.exports = ImageComponent;

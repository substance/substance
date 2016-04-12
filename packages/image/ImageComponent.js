'use strict';

var Component = require('../../ui/Component');

function ImageComponent() {
  ImageComponent.super.apply(this, arguments);
}

ImageComponent.Prototype = function() {

  this.didMount = function() {
    var doc = this.props.doc;
    doc.on('document:changed', this.onDocumentChange, this);
  };

  this.dispose = function() {
    var doc = this.props.doc;
    doc.off(this);
  };

  this.render = function($$) {
    return $$('img')
      .addClass('sc-image')
      .attr({
        "data-id": this.props.node.id,
        contentEditable: false,
        src: this.props.node.src,
      });
  };

  this.onDocumentChange = function(change) {
    if (change.isAffected([this.props.node.id, "src"])) {
      this.rerender();
    }
  };

};

Component.extend(ImageComponent);

module.exports = ImageComponent;

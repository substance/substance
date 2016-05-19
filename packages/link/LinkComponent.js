"use strict";

var AnnotationComponent = require('../../ui/AnnotationComponent');


function LinkComponent() {
  LinkComponent.super.apply(this, arguments);

  this._tagName = 'a';
}

AnnotationComponent.extend(LinkComponent, function LinkComponentPrototype() {
  this.render = function() {
    var el = AnnotationComponent.prototype.render.call(this);
    el.attr('href', this.props.node.url);

    var titleComps = [this.props.node.url];
    if (this.props.node.title) {
      titleComps.push(this.props.node.title);
    }

    return el.attr("title", titleComps.join(' | '));
  };

  this.didMount = function() {
    AnnotationComponent.prototype.didMount.call(this);
    var node = this.props.node;
    node.connect(this, {'title:changed': this.rerender});
    node.connect(this, {'url:changed': this.rerender});
  };

  this.dispose = function() {
    AnnotationComponent.prototype.dispose.call(this);
    var doc = this.props.node.getDocument();
    doc.getEventProxy('path').disconnect(this.props.node);
    this.props.node.disconnect(this);
  };
});

module.exports = LinkComponent;
'use strict';

var AnnotationComponent = require('../../ui/AnnotationComponent');

function LinkComponent() {
  LinkComponent.super.apply(this, arguments);
}

LinkComponent.Prototype = function() {

  var _super = LinkComponent.super.prototype;

  this.didMount = function() {
    _super.didMount.apply(this, arguments);

    var node = this.props.node;
    node.on('properties:changed', this.rerender, this);
  };

  this.dispose = function() {
    _super.dispose.apply(this, arguments);

    var node = this.props.node;
    node.off(this);
  };

  this.render = function($$) { // eslint-disable-line
    var el = _super.render.apply(this, arguments);

    el.tagName = 'a';
    el.attr('href', this.props.node.url);

    var titleComps = [this.props.node.url];
    if (this.props.node.title) {
      titleComps.push(this.props.node.title);
    }

    return el.attr("title", titleComps.join(' | '));
  };

};

AnnotationComponent.extend(LinkComponent);

module.exports = LinkComponent;

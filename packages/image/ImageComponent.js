'use strict';

var BlockNodeComponent = require('../../ui/BlockNodeComponent');

function ImageComponent() {
  ImageComponent.super.apply(this, arguments);
}

ImageComponent.Prototype = function() {

  var _super = ImageComponent.super.prototype;

  this.didMount = function() {
    _super.didMount.call(this);

    this.props.node.on('src:changed', this.rerender, this);
  };

  this.dispose = function() {
    _super.dispose.call(this);

    this.props.node.off(this);
  };

  this.getTagName = function() {
    return 'img';
  };

  this.render = function($$) {
    var el = _super.render.call(this, $$);
    el.addClass('sc-image')
      .attr({
        src: this.props.node.src,
      });
    return el;
  };

};

BlockNodeComponent.extend(ImageComponent);

module.exports = ImageComponent;

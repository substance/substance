'use strict';

var AnnotationComponent = require('./AnnotationComponent');

function InlineNodeComponent() {
  InlineNodeComponent.super.apply(this, arguments);
}

InlineNodeComponent.Prototype = function() {

  var _super = InlineNodeComponent.super.prototype;

  // TODO: we should avoid to have a didMount hook on an abstract base class
  this.didMount = function() {
    _super.didMount.apply(this, arguments);
  };

  // TODO: we should avoid to have a didMount hook on an abstract base class
  this.dispose = function() {
    _super.dispose.apply(this, arguments);
  };

  this.render = function($$) {
    var el = $$('span')
      .addClass('sc-inline-node')
      .attr({
        "data-inline": 1,
        "contenteditable": false
      });

    // TODO: enable this as soon we fixed the rendering issue coming up when activating this
    // var surface = this.context.surface;
    // if (surface && !surface.isDisabled()) {
    //   el.on('mousedown', _onMousedown, this);
    // }

    return el;
  };

  // Note: using a closure function to not polute the prototype avoiding name-clashes
  function _onMousedown(event) { // eslint-disable-line
    /* eslint-disable no-invalid-this */
    event.stopPropagation();
    var node = this.props.node;
    var doc = this.props.node.getDocument();
    var surface = this.context.surface;
    var sel = doc.createSelection(node.path, node.startOffset, node.endOffset);
    surface.setSelection(sel);
    /* eslint-enable no-invalid-this */
  }

};

AnnotationComponent.extend(InlineNodeComponent);

module.exports = InlineNodeComponent;

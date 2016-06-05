'use strict';

var InlineNodeComponent = require('./InlineNodeComponent');

function InlineWrapperComponent() {
  InlineWrapperComponent.super.apply(this, arguments);
}

InlineWrapperComponent.Prototype = function() {

  var _super = InlineWrapperComponent.super.prototype;

  this.render = function($$) {
    var el = _super.render.apply(this, arguments);
    el.addClass('sc-inline-wrapper');

    var node = this.props.node;
    var doc = node.getDocument();
    var wrappedNode = doc.get(node.wrappedNode);
    if (wrappedNode) {
      var componentRegistry = this.context.componentRegistry || this.props.componentRegistry;
      var ComponentClass = componentRegistry.get(wrappedNode.type);
      if (!ComponentClass) {
        error('Could not resolve a component for type: ' + wrappedNode.type);
      } else {
        el.append(
          $$(ComponentClass, {
            doc: doc,
            node: wrappedNode
          })
        );
      }
    }
    return el;
  };

};

InlineNodeComponent.extend(InlineWrapperComponent);

module.exports = InlineWrapperComponent;

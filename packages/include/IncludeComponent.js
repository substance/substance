'use strict';

var error = require('../../util/error');
var BlockNodeComponent = require('../../ui/BlockNodeComponent');
var UnsupportedNode = require('../../ui/UnsupportedNodeComponent');

function IncludeComponent() {
  IncludeComponent.super.apply(this, arguments);
}

IncludeComponent.Prototype = function() {

  var _super = IncludeComponent.super.prototype;

  this.render = function($$) {
    var doc = this.props.doc;
    var node = doc.get(this.props.node.nodeId);
    var componentRegistry = this.context.componentRegistry;
    var ComponentClass = componentRegistry.get(node.type);
    if (!ComponentClass) {
      error('Could not resolve a component for type: ' + node.type);
      ComponentClass = UnsupportedNode;
    }

    var el = _super.render.call(this, $$);
    el.addClass("sc-include")
      .append(
        $$(ComponentClass, { doc: doc, node: node }).ref(node.id)
      );
    return el;
  };
};

BlockNodeComponent.extend(IncludeComponent);

module.exports = IncludeComponent;

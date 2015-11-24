'use strict';

var _ = require('../../util/helpers');
var Component = require('../../ui/Component');
var ContainerNodeMixin = require('../../ui/ContainerNodeMixin');
var $$ = Component.$$;

function ContainerRenderer() {
  Component.apply(this, arguments);
}

ContainerRenderer.Prototype = function() {

  _.extend(this, ContainerNodeMixin.prototype);

  this.render = function() {
    var doc = this.context.doc;
    var containerNode = doc.get(this.props.containerId);

    var el = $$("div")
      .addClass('sc-container-renderer ')
      .attr({
        spellCheck: false,
        "data-id": containerNode.id,
        "contenteditable": false
      });

    // node components
    _.each(containerNode.nodes, function(nodeId) {
      el.append(this._renderNode(nodeId));
    }, this);

    return el;
  };

};

Component.extend(ContainerRenderer, ContainerNodeMixin);

module.exports = ContainerRenderer;
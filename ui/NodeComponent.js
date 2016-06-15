'use strict';

var Component = require('./Component');

function NodeComponent() {
  NodeComponent.super.apply(this, arguments);
}

NodeComponent.Prototype = function() {

  this.render = function($$) {
    var tagName = this.getTagName();
    var el = $$(tagName)
      .attr("data-id", this.props.node.id)
      .addClass('sc-node');
    return el;
  };

  this.getTagName = function() {
    return 'div';
  };

};

Component.extend(NodeComponent);

module.exports = NodeComponent;

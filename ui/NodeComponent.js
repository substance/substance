'use strict';

import Component from './Component'

function NodeComponent() {
  NodeComponent.super.apply(this, arguments);
}

NodeComponent.Prototype = function() {

  this.render = function($$) {
    var tagName = this.getTagName();
    var el = $$(tagName)
      .attr('data-id', this.props.node.id)
      .addClass(this.getClassNames());
    return el;
  };

  this.getTagName = function() {
    return 'div';
  };

  this.getClassNames = function() {
    return '';
  };

};

Component.extend(NodeComponent);

export default NodeComponent;

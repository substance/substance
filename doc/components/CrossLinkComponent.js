'use strict';

var Component = require('../../ui/Component');
var $$ = Component.$$;

function CrossLinkComponent() {
  Component.apply(this, arguments);
}

CrossLinkComponent.Prototype = function() {
  this.render = function() {
    var doc = this.context.doc;
    var nodeId = this.props.nodeId;
    var el;
    if (nodeId && doc.get(nodeId)) {
      el = $$('a').addClass('sc-cross-link')
        .attr({
          href: '#contextId=toc,nodeId='+nodeId,
          "data-type": 'cross-link',
          "data-node-id": nodeId
        });
    } else {
      el = $$('span');
    }
    if (this.props.children) {
      el.append(this.props.children);
    } else {
      el.append(nodeId);
    }
    return el;
  };
};

Component.extend(CrossLinkComponent);

module.exports = CrossLinkComponent;

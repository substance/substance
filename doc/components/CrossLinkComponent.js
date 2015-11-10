'use strict';

var oo = require('../../util/oo');
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
        .attr({href: '#', "data-type": 'cross-link', "data-node-id": nodeId})
        .append(nodeId);
    } else {
      el = $$('span').append(nodeId);
    }
    return el;
  };
};

oo.inherit(CrossLinkComponent, Component);

module.exports = CrossLinkComponent;

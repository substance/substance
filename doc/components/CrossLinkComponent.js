'use strict';

var Component = require('../../ui/Component');

function CrossLinkComponent() {
  CrossLinkComponent.super.apply(this, arguments);
}

CrossLinkComponent.Prototype = function() {
  this.render = function($$) {
    var node = this.props.node;
    var el;
    if (node) {
      el = $$('a').addClass('sc-cross-link')
        .attr({
          href: '#'+node.id,
          "data-type": 'cross-link',
          "data-node-id": node.id
        });
    } else {
      el = $$('span');
    }
    if (this.props.children.length > 0) {
      el.append(this.props.children);
    }
    return el;
  };
};

Component.extend(CrossLinkComponent);

module.exports = CrossLinkComponent;

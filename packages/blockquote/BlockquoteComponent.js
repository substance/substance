'use strict';

var Component = require('../../ui/Component');
var TextProperty = require('../../ui/TextPropertyComponent');

function Blockquote() {
  Blockquote.super.apply(this, arguments);
}

Blockquote.Prototype = function() {

  this.render = function($$) {
    return $$('div')
      .addClass('sc-blockquote')
      .attr('data-id', this.props.node.id)
      .append($$(TextProperty, {
        path: [this.props.node.id, 'content']
      }));
  };

};

Component.extend(Blockquote);

module.exports = Blockquote;

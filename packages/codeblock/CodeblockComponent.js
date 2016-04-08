'use strict';

var Component = require('../../ui/Component');
var TextProperty = require('../../ui/TextPropertyComponent');

function Codeblock() {
  Codeblock.super.apply(this, arguments);
}

Codeblock.Prototype = function() {

  this.render = function($$) {
    return $$('div')
      .addClass('sc-codeblock')
      .attr('data-id', this.props.node.id)
      .append($$(TextProperty, {
        path: [ this.props.node.id, "content"]
      }));
  };

};

Component.extend(Codeblock);

module.exports = Codeblock;
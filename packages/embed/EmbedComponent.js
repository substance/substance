'use strict';

var OO = require('../../basics/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function Embed() {
  Component.apply(this, arguments);
}

Embed.Prototype = function() {

  this.getClassNames = function() {
    return "content-node sc-embed";
  };

  this.render = function() {
    var node = this.props.node;
    var contextEl;
    
    if (node.src && node.html) {
      // Embed is ready for display
      contextEl = $$('div').html(node.html);
    } else {
      // Embed placeholder // needs url input
      contextEl = $$('div').append(
        $$('input').attr({type: 'text', value: 'http://'})
          .ref('src')
      );
    }

    return $$('div')
      .addClass(this.getClassNames())
      .attr("data-id", this.props.node.id)
      .append(contextEl);
  };
};

OO.inherit(Embed, Component);

module.exports = Embed;
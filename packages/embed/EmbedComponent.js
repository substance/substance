'use strict';

var Component = require('../../ui/Component');

function Embed() {
  Embed.super.apply(this, arguments);
}

Embed.Prototype = function() {

  this.render = function($$) {
    var node = this.props.node;
    var el = $$('div')
      .addClass('content-node sc-embed')
      .attr("data-id", this.props.node.id);
    if (node.src && node.html) {
      // Embed is ready for display
      el.append($$('div').html(node.html));
    } else {
      // Embed placeholder // needs url input
      el.append(
        $$('div').append(
          $$('input').attr({type: 'text', value: 'http://'}).ref('src')
        )
      );
    }
    return el;
  };
};

Component.extend(Embed);

module.exports = Embed;
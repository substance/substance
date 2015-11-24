'use strict';

var Component = require('../../ui/Component');
var $$ = Component.$$;

function CoverComponent() {
  Component.apply(this, arguments);
}

CoverComponent.Prototype = function() {

  this.render = function() {
    var node = this.props.node;

    var el = $$('div')
      .addClass('sc-cover')
      .attr("data-id", node.id);

    el.append(
      $$('div').addClass('se-title').append('Substance'),
      $$('div').addClass('se-description').html(node.description)
    );

    return el;
  };
};

Component.extend(CoverComponent);

module.exports = CoverComponent;

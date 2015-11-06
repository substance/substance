'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function ComponentComponent() {
  Component.apply(this, arguments);
}

ComponentComponent.Prototype = function() {
  this.render = function() {
    return $$('div')
      .addClass('sc-class')
      .attr("data-id", this.props.node.id)
      .append(
        'Component',
        $$('div').addClass('description').html(this.props.node.description)
      );
  };
};

oo.inherit(ComponentComponent, Component);

module.exports = ComponentComponent;

'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function PropertyComponent() {
  Component.apply(this, arguments);
}

PropertyComponent.Prototype = function() {
  this.render = function() {
    return $$('div')
      .addClass('sc-class')
      .attr("data-id", this.props.node.id)
      .append(
        'Property',
        $$('div').addClass('description').html(this.props.node.description)
      );
  };
};

oo.inherit(PropertyComponent, Component);

module.exports = PropertyComponent;

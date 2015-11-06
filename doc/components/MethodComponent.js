'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function MethodComponent() {
  Component.apply(this, arguments);
}

MethodComponent.Prototype = function() {
  this.render = function() {
    return $$('div')
      .addClass('sc-class')
      .attr("data-id", this.props.node.id)
      .append(
        'Method',
        $$('div').addClass('description').html(this.props.node.description)
      );
  };
};

oo.inherit(MethodComponent, Component);

module.exports = MethodComponent;

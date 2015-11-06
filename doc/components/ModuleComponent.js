'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function ModuleComponent() {
  Component.apply(this, arguments);
}

ModuleComponent.Prototype = function() {
  this.render = function() {
    return $$('div')
      .addClass('sc-class')
      .attr("data-id", this.props.node.id)
      .append(
        'Module',
        $$('div').addClass('description').html(this.props.node.description)
      );
  };
};

oo.inherit(ModuleComponent, Component);

module.exports = ModuleComponent;

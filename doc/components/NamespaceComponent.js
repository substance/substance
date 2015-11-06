'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function NamespaceComponent() {
  Component.apply(this, arguments);
}

NamespaceComponent.Prototype = function() {
  this.render = function() {
    return $$('div')
      .addClass('sc-class')
      .attr("data-id", this.props.node.id)
      .append(
        'Function',
        $$('div').addClass('description').html(this.props.node.description)
      );
  };
};

oo.inherit(NamespaceComponent, Component);

module.exports = NamespaceComponent;

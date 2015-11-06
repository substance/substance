'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function FunctionComponent() {
  Component.apply(this, arguments);
}

FunctionComponent.Prototype = function() {
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

oo.inherit(FunctionComponent, Component);

module.exports = FunctionComponent;

'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function HeadingComponent() {
  Component.apply(this, arguments);
}

HeadingComponent.Prototype = function() {
  this.render = function() {
    return $$('div').addClass('sc-heading').append(
      $$('span').addClass('se-namespace').append(this.props.node.namespace+' / '),
      $$('span').addClass('se-name').append(this.props.node.name),
      $$('div')
        .addClass('se-node-type')
        .addClass(this.props.node.type)
        .append(this.props.node.type)
    );
  };
};

oo.inherit(HeadingComponent, Component);

module.exports = HeadingComponent;

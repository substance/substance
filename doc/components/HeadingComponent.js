'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function HeadingComponent() {
  Component.apply(this, arguments);
}

HeadingComponent.Prototype = function() {
  this.render = function() {
    var node = this.props.node;
    return $$('div').addClass('sc-heading').append(
      $$('span').addClass('se-namespace').append(node.namespace + ' / '),
      $$('span').addClass('se-name').append(node.name),
      $$('div')
        .addClass('se-node-type')
        .addClass(node.type)
        .append(node.type)
    );
  };
};

oo.inherit(HeadingComponent, Component);

module.exports = HeadingComponent;

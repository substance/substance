'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function ClassComponent() {
  Component.apply(this, arguments);
}

ClassComponent.Prototype = function() {
  this.render = function() {
    return $$('div')
      .addClass('sc-class')
      .attr("data-id", this.props.node.id)
      .append(
        'Class',
        $$('div').addClass('description').html(this.props.node.description)
      );
  };
};

oo.inherit(ClassComponent, Component);

module.exports = ClassComponent;

'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var TextProperty = require('../../ui/TextPropertyComponent');

function HeadingComponent() {
  Component.apply(this, arguments);
}

HeadingComponent.Prototype = function() {

  this.render = function() {
    return $$('div')
      .addClass("sc-heading sm-level-"+this.props.node.level)
      .attr("data-id", this.props.node.id)
      .append($$(TextProperty, {
        path: [ this.props.node.id, "content"]
      }));
  };
};

oo.inherit(HeadingComponent, Component);

module.exports = HeadingComponent;

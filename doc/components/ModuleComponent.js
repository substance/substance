'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var Heading = require('./HeadingComponent');
var $$ = Component.$$;

function ModuleComponent() {
  Component.apply(this, arguments);
}

ModuleComponent.Prototype = function() {

  this.render = function() {
    // Constructor params
    return $$('div')
      .addClass('sc-module')
      .attr("data-id", this.props.node.id)
      .append(
        $$(Heading, {node: this.props.node}),
        $$('div').addClass('se-description').html(this.props.node.description)
        // $$(Params, {params: this.props.node.params})
      );
  };
};

oo.inherit(ModuleComponent, Component);

module.exports = ModuleComponent;

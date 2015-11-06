'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var Heading = require('./HeadingComponent');
var $$ = Component.$$;

function FunctionComponent() {
  Component.apply(this, arguments);
}

FunctionComponent.Prototype = function() {
  this.render = function() {
    // Constructor params
    return $$('div')
      .addClass('sc-function')
      .attr("data-id", this.props.node.id)
      .append(
        $$(Heading, {node: this.props.node}),
        $$('div').addClass('se-description').html(this.props.node.description)
        // $$(Params, {params: this.props.node.params})
      );
  };
};

oo.inherit(FunctionComponent, Component);

module.exports = FunctionComponent;

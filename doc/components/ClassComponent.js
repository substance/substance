'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var pluck = require('lodash/collection/pluck');

var Params = require('./ParamsComponent');
var Heading = require('./HeadingComponent');

function ClassComponent() {
  Component.apply(this, arguments);
}

ClassComponent.Prototype = function() {

  this.renderSignature = function() {
    var paramSig = pluck(this.props.node.params, 'name').join(', ');
    var sig = ['new ', this.props.node.name, '(', paramSig, ')'];
    return $$('div').addClass('se-signature').append(
      $$('span').append(sig)
    );
  };

  this.render = function() {
    // Constructor params
    return $$('div')
      .addClass('sc-class')
      .attr("data-id", this.props.node.id)
      .append(
        $$(Heading, {node: this.props.node}),
        $$('div').addClass('se-description').html(this.props.node.description),
        this.renderSignature()
        // $$(Params, {params: this.props.node.params})
      );
  };
};

oo.inherit(ClassComponent, Component);

module.exports = ClassComponent;

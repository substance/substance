'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var Params = require('./ParamsComponent');
var pluck = require('lodash/collection/pluck');

var $$ = Component.$$;

function MethodComponent() {
  Component.apply(this, arguments);
}

MethodComponent.Prototype = function() {

  this.renderSignature = function() {
    var paramSig = pluck(this.props.node.params, 'name').join(', ');
    var sig = [this.props.node.name, '(', paramSig, ')'];
    return $$('div').addClass('se-signature').append(
      $$('span').append(sig)
    );
  };

  // this.render = function() {

  //   console.log('class', this.props.node.name, 'params', this.props.node.params);
  //   // Constructor params
  //   return $$('div')
  //     .addClass('sc-class')
  //     .attr("data-id", this.props.node.id)
  //     .append(
  //       $$(Heading, {node: this.props.node}),
  //       $$('div').addClass('se-description').html(this.props.node.description),
  //       this.renderSignature(),
  //       $$(Params, {params: this.props.node.params}),
  //       $$('div').addClass('se-members').append(this._renderMembers())
  //     );
  // };

  this.render = function() {
    return $$('div')
      .addClass('sc-method')
      .attr("data-id", this.props.node.id)
      .append(
        $$('div').addClass('se-description').html(this.props.node.description),
        this.renderSignature(),
        $$(Params, {params: this.props.node.params})
      );
  };
};

oo.inherit(MethodComponent, Component);

module.exports = MethodComponent;

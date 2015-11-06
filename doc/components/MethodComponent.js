'use strict';

var oo = require('../../util/oo');
var pluck = require('lodash/collection/pluck');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var Params = require('./ParamsComponent');

function MethodComponent() {
  Component.apply(this, arguments);
}

MethodComponent.Prototype = function() {

  this.renderSignature = function() {
    var paramSig = pluck(this.props.node.params, 'name').join(', ');

    var parentNode = this.props.parentNode;
    var contextName = parentNode.name + '.';
    var sig = [this.props.node.name, '(', paramSig, ')'];

    if (parentNode.type === 'class' && !this.props.node.static) {
      contextName += 'prototype.';
    }

    return $$('div').addClass('se-signature').append(
      $$('span').addClass('se-context').append(contextName),
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
    var el = $$('div')
      .addClass('sc-method')
      .attr("data-id", this.props.node.id);

    // the method signature, such as Document.prototype.getNodes()
    el.append(this.renderSignature());

    // argument description
    el.append(
      $$(Params, {params: this.props.node.params})
    );

    // if given a message indicating that this method has been inherited
    if (this.props.inheritedFrom) {
      el.append(
        $$('div').addClass('se-inherited-from')
        .append(
          $$('span').addClass('se-label').append(this.i18n.t('inherited-from')),
          $$('a').addClass('se-parent-class')
            .attr('href','#'+this.props.inheritedFrom)
            .append(this.props.inheritedFrom)
        )
      );
    }

    // the description
    el.append(
      $$('div').addClass('se-description').html(this.props.node.description)
    );

    return el;
  };
};

oo.inherit(MethodComponent, Component);

module.exports = MethodComponent;

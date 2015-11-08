'use strict';

var oo = require('../../util/oo');
var pluck = require('lodash/collection/pluck');
var Component = require('../../ui/Component');
var $$ = Component.$$;

var Signature = require('./SignatureComponent');
var Example = require('./ExampleComponent');

function MethodComponent() {
  Component.apply(this, arguments);
}

MethodComponent.Prototype = function() {

  this.render = function() {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-method')
      .attr("data-id", node.id);

    // signature
    el.append($$(Signature, {node: node}));

    // the description
    el.append(
      $$('div').addClass('se-description').html(node.description)
    );

    if (node.example) {
      el.append($$(Example, {node:node}));
    }

    return el;
  };

  this.renderSignature = function() {
    var node = this.props.node;
    var paramSig = pluck(node.params, 'name').join(', ');
    var parentNode = this.props.parentNode;
    // signature such as `foo(a, b)`
    var sig = [node.name, '(', paramSig, ')'];
    // context is either the class or module id
    // while the context for (non-static) instance methods is `MyClass.prototype`
    var context = parentNode.name + '.';
    if (parentNode.type === 'class' && !node.isStatic) {
      context += 'prototype.';
    }
    return $$('div').addClass('se-signature').append(
      // $$('span').addClass('se-context').append(context),
      $$('span').append(sig)
    );
  };

};

oo.inherit(MethodComponent, Component);

module.exports = MethodComponent;

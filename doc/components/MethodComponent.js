'use strict';

var oo = require('../../util/oo');
var pluck = require('lodash/collection/pluck');
var Component = require('../../ui/Component');
var $$ = Component.$$;

var Params = require('./ParamsComponent');
var Example = require('./ExampleComponent');

function MethodComponent() {
  Component.apply(this, arguments);
}

MethodComponent.Prototype = function() {

  this.renderSignature = function() {
    var node = this.props.node;
    var paramSig = pluck(node.params, 'name').join(', ');
    var parentNode = this.props.parentNode;
    // signature such as `foo(a, b)`
    var sig = [node.name, '(', paramSig, ')'];
    // context is either the class or module id
    // while the context for (non-static) instance methods is `MyClass.prototype`
    var context = parentNode.name + '.';
    if (parentNode.type === 'class' && !node.static) {
      context += 'prototype.';
    }
    return $$('div').addClass('se-signature').append(
      $$('span').addClass('se-context').append(context),
      $$('span').append(sig)
    );
  };

  this.render = function() {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-method')
      .attr("data-id", node.id);

    // the method signature, such as Document.prototype.getNodes()
    el.append(
      this.renderSignature()
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
      $$('div').addClass('se-description').html(node.description)
    );

    if (node.params.length > 0) {
      el.append($$(Params, {params: node.params}));
    }

    if (node.example) {
      el.append($$(Example, {node:node}));
    }

    return el;
  };
};

oo.inherit(MethodComponent, Component);

module.exports = MethodComponent;

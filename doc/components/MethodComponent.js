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

};

oo.inherit(MethodComponent, Component);

module.exports = MethodComponent;

'use strict';

var oo = require('../../util/oo');
var pluck = require('lodash/collection/pluck');
var Component = require('../../ui/Component');
var $$ = Component.$$;

var Heading = require('./HeadingComponent');
var Example = require('./ExampleComponent');

function FunctionComponent() {
  Component.apply(this, arguments);
}

FunctionComponent.Prototype = function() {

  this.render = function() {
    var node = this.props.node;

    // Constructor params
    var el = $$('div')
      .addClass('sc-function')
      .attr("data-id", node.id);
    // header
    el.append($$(Heading, {node: node}));
    //signature
    el.append(this.renderSignature());
    // description
    el.append($$('div').addClass('se-description').html(node.description));
    // example
    if (node.example) {
      el.append($$(Example, {node: node}));
    }
    return el;
  };

  this.renderSignature = function() {
    var node = this.props.node;
    var paramSig = pluck(node.params, 'name').join(', ');
    var signature = [node.name, '(', paramSig, ')'];
    return $$('div').addClass('se-signature')
      .append(
        $$('span').addClass('se-context').append(node.id + "/"),
        $$('span').append(signature)
      );
  };

};

oo.inherit(FunctionComponent, Component);

module.exports = FunctionComponent;

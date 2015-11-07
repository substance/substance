'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var Heading = require('./HeadingComponent');

function PropertyComponent() {
  Component.apply(this, arguments);
}

PropertyComponent.Prototype = function() {

  this.render = function() {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-class')
      .attr("data-id", node.id);
    // heading
    el.append($$(Heading, {node: node}));
    // description
    if(node.description) {
      el.append($$('div').addClass('se-description').html(node.description));
    }
    // example
    if (node.example) {
      el.append($$('div').addClass('se-example').html(node.example));
    }
    return el;
  };

};

oo.inherit(PropertyComponent, Component);
module.exports = PropertyComponent;

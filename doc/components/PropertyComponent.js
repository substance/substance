'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var Example = require('./ExampleComponent');
var Documentation = require('../model/Documentation');

function PropertyComponent() {
  Component.apply(this, arguments);
}

PropertyComponent.Prototype = function() {

  this.render = function() {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-property')
      .attr("data-id", node.id);
    var info = Documentation.getNodeInfo(node);
    var visibility = node.isPrivate ? "private " : "";

    // declaration
    el.append(
      $$('div').addClass('se-declaration')
        .append($$('span').addClass('se-visibility').append(visibility))
        .append($$('span').addClass('se-storage').append(info.storage))
        .append($$('span').addClass('se-name').append(node.name))
        .append(': ')
        .append($$('span').addClass('se-type').append(node.dataType))
    );
    // description
    el.append($$('div').addClass('se-description').html(node.description));
    // example
    if (node.example) {
      el.append($$(Example, {node: node}));
    }

    return el;
  };

};

oo.inherit(PropertyComponent, Component);
module.exports = PropertyComponent;

'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

var DocumentationNodeComponent = require('./DocumentationNodeComponent');
var Heading = require('./HeadingComponent');
var Example = require('./ExampleComponent');

function ModuleComponent() {
  DocumentationNodeComponent.apply(this, arguments);
}

ModuleComponent.Prototype = function() {

  this.render = function() {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-module')
      .attr("data-id", node.id)

    // heading
    el.append($$(Heading, {namespace: node.namespace, name: node.name, type: node.type}));
    // description
    el.append(
      $$('div').addClass('se-description').html(node.description)
    );
    // members
    el.append(
      $$('div').addClass('se-members').append(this._renderMembers())
    );
    // example
    if (node.example) {
      el.append($$(Example, {node:node}));
    }

    return el;
  };
};

oo.inherit(ModuleComponent, DocumentationNodeComponent);

module.exports = ModuleComponent;

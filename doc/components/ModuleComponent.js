'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

var DocumentationNodeComponent = require('./DocumentationNodeComponent');
var Heading = require('./HeadingComponent');
var Example = require('./ExampleComponent');
var MemberIndexComponent = require('./MemberIndexComponent');

function ModuleComponent() {
  DocumentationNodeComponent.apply(this, arguments);
}

ModuleComponent.Prototype = function() {

  this.render = function() {

    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-module')
      .attr("data-id", node.id);

    // heading
    el.append($$(Heading, {node: node}));
    // description
    el.append(
      $$('div').addClass('se-description').html(node.description)
    );
    // example
    if (node.example) {
      el.append($$(Example, {node:node}));
    }

    // members
    if (node.members && node.members.length > 0) {
      // member index
      el.append($$(MemberIndexComponent, {node: node}));
      // members
      el.append(
        $$('div').addClass('se-members').append(this._renderMembers())
      );
    }

    return el;
  };
};

oo.inherit(ModuleComponent, DocumentationNodeComponent);

module.exports = ModuleComponent;

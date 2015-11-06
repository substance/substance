'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

var DocumentationNodeComponent = require('./DocumentationNodeComponent');
var Heading = require('./HeadingComponent');

function ModuleComponent() {
  DocumentationNodeComponent.apply(this, arguments);
}

ModuleComponent.Prototype = function() {

  this.render = function() {
    return $$('div')
      .addClass('sc-module')
      .attr("data-id", this.props.node.id)
      .append(
        $$(Heading, {node: this.props.node}),
        $$('div').addClass('se-description').html(this.props.node.description),
        $$('div').addClass('se-members').append(this._renderMembers())
      );
  };
};

oo.inherit(ModuleComponent, DocumentationNodeComponent);

module.exports = ModuleComponent;

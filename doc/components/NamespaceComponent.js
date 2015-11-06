'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var DocumentationNodeComponent = require('./DocumentationNodeComponent');
var $$ = Component.$$;

function NamespaceComponent() {
  DocumentationNodeComponent.apply(this, arguments);
}

NamespaceComponent.Prototype = function() {

  this.render = function() {
    return $$('div')
      .addClass('sc-namespace')
      .attr("data-id", this.props.node.id)
      .append(
        $$('div').addClass('se-name').html(this.props.node.id),
        $$('div').addClass('se-description').html(this.props.node.description),
        $$('div').addClass('se-members').append(this._renderMembers())
      );
  };
};

oo.inherit(NamespaceComponent, DocumentationNodeComponent);

module.exports = NamespaceComponent;

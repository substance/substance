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
    var members = this._renderMembers();
    return $$('div')
      .addClass('sc-class')
      .attr("data-id", this.props.node.id)
      .append(
        $$('div').addClass('name').html(this.props.node.description),
        $$('div').addClass('description').html(this.props.node.description),
        $$('div').addClass('members').append(members)
      );
  };
};

oo.inherit(NamespaceComponent, DocumentationNodeComponent);

module.exports = NamespaceComponent;

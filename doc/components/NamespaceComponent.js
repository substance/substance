'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var DocumentationNodeComponent = require('./DocumentationNodeComponent');
var $$ = Component.$$;

function NamespaceComponent() {
  DocumentationNodeComponent.apply(this, arguments);
}

NamespaceComponent.Prototype = function() {

  this.onClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.send('focusNode', this.props.node.id);
  };

  this.render = function() {
    var node = this.props.node;
    return $$('div')
      .addClass('sc-namespace')
      .attr("data-id", node.id)
      .append(
        $$('a').addClass('se-name')
          .html(node.id)
          .on('click', this.onClick)
          .attr({href: '#'}),
        $$('div').addClass('se-description').html(node.description),
        $$('div').addClass('se-members').append(this._renderMembers())
      );
  };
};

oo.inherit(NamespaceComponent, DocumentationNodeComponent);

module.exports = NamespaceComponent;

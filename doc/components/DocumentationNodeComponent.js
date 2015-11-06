'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var UnsupportedNode = require('../../ui/UnsupportedNode');
var $$ = Component.$$;

function DocumentationNodeComponent() {
  Component.apply(this, arguments);
}

DocumentationNodeComponent.Prototype = function() {

  // Render all members
  this._renderMembers = function() {
    var node = this.props.node;
    var doc = node.getDocument();
    var componentRegistry = this.context.componentRegistry;
    var members = [];

    node.members.forEach(function(memberId) {
      var memberNode = doc.get(memberId);
      var ComponentClass = componentRegistry.get(memberNode.type);
      if (!ComponentClass) {
        console.error('Could not resolve a component for type: ' + node.type);
        ComponentClass = UnsupportedNode;
      }

      members.push($$(ComponentClass, {
        doc: doc,
        node: memberNode
      }));
    });

    return members;
  };
};

oo.inherit(DocumentationNodeComponent, Component);

module.exports = DocumentationNodeComponent;

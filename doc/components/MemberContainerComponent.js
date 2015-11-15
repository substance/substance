'use strict';

var oo = require('../../util/oo');
var filter = require('lodash/collection/filter');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var UnsupportedNode = require('../../ui/UnsupportedNode');

function MemberContainerComponent() {
  Component.apply(this, arguments);
}

MemberContainerComponent.Prototype = function() {

  this.getMemberCategories = function() {
    throw new Error('Is abstract');
  };

  this._renderMembers = function() {
    var el = $$('div');
    this.getMemberCategories().forEach(function(cat) {
      var catMembers = this._getCategoryMembers(cat);
      if (catMembers.length > 0) {
        el.append(this._renderMemberCategory(cat, catMembers));
      }
    }.bind(this));
    return el.children;
  };

  this._renderMemberCategory = function(cat, catMembers) {
    var catEl = $$('div').addClass('se-member-category');
    var membersEl = $$('div').addClass('se-members');
    catMembers.forEach(function(memberNode) {
      membersEl.append(this._renderMember(memberNode));
    }.bind(this));
    catEl.append(membersEl);
    return catEl;
  };

  this._renderMember = function(memberNode) {
    var node = this.props.node;
    var doc = node.getDocument();
    var componentRegistry = this.context.componentRegistry;
    var ComponentClass = componentRegistry.get(memberNode.type);
    if (!ComponentClass) {
      console.error('Could not resolve a component for type: ' + node.type);
      ComponentClass = UnsupportedNode;
    }
    return $$(ComponentClass, {
      doc: doc,
      node: memberNode,
      parentNode: node
    });
  };

  this._getCategoryMembers = function(cat) {
    var config = this.context.config;
    var node = this.props.node;
    return MemberContainerComponent.getCategoryMembers(config, node, cat);
  };

};

oo.inherit(MemberContainerComponent, Component);

MemberContainerComponent.getCategoryMembers = function(config, node, cat) {
  var doc = node.getDocument();
  var memberIndex = doc.getIndex('members');
  var members = memberIndex.get([node.id].concat(cat.path));
  members = filter(members, function(memberNode) {
    // skip nodes according to configuration
    if ((memberNode.type === "method" && memberNode.isPrivate && config.skipPrivateMethods) ||
      (memberNode.type === "class" && memberNode.isAbstract && config.skipAbstractClasses)) {
      return false;
    }
    return true;
  });
  return members;
};

module.exports = MemberContainerComponent;

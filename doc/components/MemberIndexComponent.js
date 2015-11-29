'use strict';

var each = require('lodash/collection/each');
var sortBy = require('lodash/collection/sortBy');
var $$ = require('../../ui/Component').$$;
var MemberContainerComponent = require('./MemberContainerComponent');
var CrossLink = require('./CrossLinkComponent');

function MemberIndexComponent() {
  MemberContainerComponent.apply(this, arguments);
}

MemberIndexComponent.Prototype = function() {

  var _super = MemberIndexComponent.super.prototype;

  this.render = function() {
    var el = $$('div').addClass('sc-member-index');
    el.append(this._renderMembers());
    return el;
  };

  this._renderMembers = function() {
    var children = _super._renderMembers.call(this);
    var node = this.props.node;
    if (node.type === 'class' && node.superClass) {
      children = children.concat(this._renderInheritedMembers());
    }
    return children;
  };

  this._renderInheritedMembers = function() {
    var elements = [];
    var config = this.context.config;
    var node = this.props.node;
    var categories = node.getMemberCategories();
    var inheritedMembers = node.getInheritedMembers(config);
    each(inheritedMembers, function(members, group) {
      members = sortBy(members, 'id');
      var cat = categories[group];
      var catEl = _super._renderMemberCategory.call(this, cat, members);
      catEl.insertAt(0,
        $$('span').addClass('se-label').append(this.i18n.t('inherited-' + cat.name))
      );
      elements.push(catEl);
    }.bind(this));
    return elements;
  };

  this._renderMemberCategory = function(cat) {
    var catEl = _super._renderMemberCategory.apply(this, arguments);
    catEl.insertAt(0,
      $$('span').addClass('se-label').append(this.i18n.t(cat.name))
    );
    return catEl;
  };

  this._renderMember = function(memberNode) {
    return $$(CrossLink, {doc: this.props.doc, nodeId: memberNode.id})
      .append(memberNode.name, ' ');
  };

  this.getMemberCategories = function() {
    return this.props.node.getMemberCategories();
  };

};

MemberContainerComponent.extend(MemberIndexComponent);

module.exports = MemberIndexComponent;
'use strict';

var oo = require('../../util/oo');
var $$ = require('../../ui/Component').$$;
var MemberContainerComponent = require('./MemberContainerComponent');

function MemberIndexComponent() {
  MemberContainerComponent.apply(this, arguments);
}

MemberIndexComponent.Prototype = function() {

  this.render = function() {
    var el = $$('div').addClass('sc-member-index');
    el.append(this._renderMembers());
    return el;
  };

  this._renderMemberCategory = function(cat) {
    var catEl = MemberIndexComponent.super.prototype._renderMemberCategory.apply(this, arguments);
    catEl.insertAt(0,
      $$('span').addClass('se-label').append(this.i18n.t(cat.name))
    );
    return catEl;
  };

  this._renderMember = function(memberNode) {
    return $$('a').attr({
        'data-type': 'cross-link',
        'data-node-id': memberNode.id,
        'href': '#',
      }).append(memberNode.name, ' ');
  };

  this.getMemberCategories = function() {
    return this.props.categories;
  };

};

oo.inherit(MemberIndexComponent, MemberContainerComponent);

module.exports = MemberIndexComponent;
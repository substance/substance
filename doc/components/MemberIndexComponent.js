'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var _map = require('lodash/collection/map');
var $$ = Component.$$;


var CATEGORIES = [
  {name: 'instance-methods', path: ['instance', 'method']},
  {name: 'instance-properties', path: ['instance', 'property']},

  {name: 'class-methods', path: ['class', 'method']},
  {name: 'class-properties', path: ['class', 'property']},
  {name: 'inner-classes', path: ['class', 'class']}
];

function MemberIndexComponent() {
  Component.apply(this, arguments);
}

MemberIndexComponent.Prototype = function() {
  this._getMembersByType = function(type, subType) {
    var node = this.props.node;
    var doc = node.getDocument();
    var membersByType = doc.getIndex('members').get(node.id);

    var members = [];
    if (membersByType[type]) {
      members = _map(membersByType[type][subType]);
    }
    return members;
  };

  this.render = function() {
    var el = $$('div').addClass('sc-member-index');

    CATEGORIES.forEach(function(cat) {
      var catMembers = this._getMembersByType.apply(this, cat.path);

      if (catMembers.length > 0) {
        var members = $$('div').addClass('se-members');
        catMembers.forEach(function(member) {
          members.append($$('a').attr({
            'data-type': 'cross-link',
            'data-node-id': member.id,
            href: '#',
          }).append(member.name, ' '));
        });

        // Label
        el.append($$('span').addClass('se-label').append(
          this.i18n.t(cat.name))
        );
        el.append(members);
      }
    }.bind(this));

    return el;
  };
};

oo.inherit(MemberIndexComponent, Component);

module.exports = MemberIndexComponent;
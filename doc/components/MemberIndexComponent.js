'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

function MemberIndexComponent() {
  Component.apply(this, arguments);
}

MemberIndexComponent.Prototype = function() {
  // TODO: Categorization of members:
  //   - methods (static with prototype)
  //   - events
  //   - properties
  //   - inherited members
  this.render = function() {
    var node = this.props.node;
    var doc = node.getDocument();
    var el = $$('div').addClass('sc-member-index');
    var members = $$('div').addClass('se-members');

    node.members.forEach(function(memberId) {
      var member = doc.get(memberId);
      if (member) {
        members.append($$('a').attr({
          'data-type': 'cross-link',
          'data-node-id': memberId,
          href: '#',
        }).append(member.name, ' '));
      }
    });

    // Label
    el.append($$('span').addClass('se-label').append('Members'));
    el.append(members);

    return el;
  };
};

oo.inherit(MemberIndexComponent, Component);

module.exports = MemberIndexComponent;
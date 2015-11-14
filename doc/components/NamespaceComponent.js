'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;
var MemberContainerComponent = require('./MemberContainerComponent');
var MemberIndexComponent = require('./MemberIndexComponent');

function NamespaceComponent() {
  MemberContainerComponent.apply(this, arguments);
}

NamespaceComponent.Prototype = function() {

  this.onClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.send('focusNode', this.props.node.id);
  };

  this.render = function() {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-namespace')
      .attr("data-id", node.id);

    // title
    el.append(
      $$('a').addClass('se-name')
        .html(node.id)
        .on('click', this.onClick)
        .attr({href: '#'})
    );
    //description
    el.append(
      $$('div').addClass('se-description').html(node.description)
    );
    if (node.members.length > 0) {
      // member index
      el.append($$(MemberIndexComponent, {node: node, categories: this.getMemberCategories()}));
      // members
      el.append(this._renderMembers());
    }

    return el;
  };

  var MEMBER_CATEGORIES = [
    {name: 'modules', path: ['module']},
    {name: 'classes', path: ['class']},
    {name: 'functions', path: ['function']},
  ];

  this.getMemberCategories = function() {
    return MEMBER_CATEGORIES;
  };

};

oo.inherit(NamespaceComponent, MemberContainerComponent);

module.exports = NamespaceComponent;

'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var MemberContainerComponent = require('./MemberContainerComponent');
var $$ = Component.$$;

var Heading = require('./HeadingComponent');
var Example = require('./ExampleComponent');
var MemberIndexComponent = require('./MemberIndexComponent');

function ClassComponent() {
  MemberContainerComponent.apply(this, arguments);
}

ClassComponent.Prototype = function() {

  /**
    Can be overridden by custom components.

    @see SubstanceClassComponent, which gives special treatment to @component classes
  */
  this.renderUsage = function() {
    var el = $$('div').addClass('se-usage');
    if (node.example) {
      el.append($$(Example, {node: node}));
    }
    return el;
  };

  this.render = function() {
    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-class')
      .attr("data-id", this.props.node.id);
    // class header
    el.append($$(Heading, {node: node}));
    // the description
    console.log('class description', node.description);
    el.append(
      $$('div').addClass('se-description').html(node.description)
    );
    // useage block
    el.append(this.renderUsage());

    if (node.members && node.members.length > 0) {
      // member index
      el.append($$(MemberIndexComponent, {node: node, categories: this.getMemberCategories()}));
      // members
      el.append(this._renderMembers());
    }

    return el;
  };

  var MEMBER_CATEGORIES = [
    {name: 'ctor', path: ['class', 'ctor']},
    {name: 'instance-methods', path: ['instance', 'method']},
    {name: 'instance-properties', path: ['instance', 'property']},
    {name: 'instance-events', path: ['instance', 'event']},

    {name: 'class-methods', path: ['class', 'method']},
    {name: 'class-properties', path: ['class', 'property']},
    {name: 'inner-classes', path: ['class', 'class']}
  ];

  this.getMemberCategories = function() {
    return MEMBER_CATEGORIES;
  };

};
oo.inherit(ClassComponent, MemberContainerComponent);

module.exports = ClassComponent;

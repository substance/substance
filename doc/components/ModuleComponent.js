'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var $$ = Component.$$;

var MemberContainerComponent = require('./MemberContainerComponent');
var Heading = require('./HeadingComponent');
var Example = require('./ExampleComponent');
var MemberIndexComponent = require('./MemberIndexComponent');

function ModuleComponent() {
  MemberContainerComponent.apply(this, arguments);
}

ModuleComponent.Prototype = function() {

  this.render = function() {

    var node = this.props.node;
    var el = $$('div')
      .addClass('sc-module')
      .attr("data-id", node.id);

    // heading
    el.append($$(Heading, {node: node}));
    // description
    el.append(
      $$('div').addClass('se-description').html(node.description)
    );
    // example
    if (node.example) {
      el.append($$(Example, {node:node}));
    }

    // members
    if (node.members && node.members.length > 0) {
      // member index
      el.append($$(MemberIndexComponent, {node: node, categories: this.getMemberCategories()}));
      // members
      el.append(this._renderMembers());
    }

    return el;
  };

  var MEMBER_CATEGORIES = [
    {name: 'classes', path: ['class']},
    {name: 'methods', path: ['method']},
    {name: 'properties', path: ['property']},
  ];

  this.getMemberCategories = function() {
    return MEMBER_CATEGORIES;
  };

};

oo.inherit(ModuleComponent, MemberContainerComponent);

module.exports = ModuleComponent;

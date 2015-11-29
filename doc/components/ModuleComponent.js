'use strict';

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
      el.append($$(MemberIndexComponent, {node: node}));
      // members
      el.append(this._renderMembers());
    }

    return el;
  };

};

MemberContainerComponent.extend(ModuleComponent);

module.exports = ModuleComponent;

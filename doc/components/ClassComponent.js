'use strict';

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
    var node = this.props.node;
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
    el.append(
      $$('div').addClass('se-description').html(node.description)
    );
    // useage block
    el.append(this.renderUsage());

    if (node.members && node.members.length > 0) {
      // member index
      el.append($$(MemberIndexComponent, {node: node}));
      // members
      el.append(this._renderMembers());
    }

    return el;
  };

};

MemberContainerComponent.extend(ClassComponent);

module.exports = ClassComponent;

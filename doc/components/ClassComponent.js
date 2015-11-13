'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var DocumentationNodeComponent = require('./DocumentationNodeComponent');
var $$ = Component.$$;
var each = require('lodash/collection/each');

var Signature = require('./SignatureComponent');
var Heading = require('./HeadingComponent');
var Params = require('./ParamsComponent');
var Example = require('./ExampleComponent');
var MethodComponent = require('./MethodComponent');
var MemberIndexComponent = require('./MemberIndexComponent');

function ClassComponent() {
  DocumentationNodeComponent.apply(this, arguments);
}

ClassComponent.Prototype = function() {

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
    // example
    if (node.example) {
      el.append($$(Example, {node: node}));
    }
    // constructor
    el.append(
      $$('div').addClass('se-constructor sc-method')
        .append($$(Signature, {node: node}))
    );
    // params
    if (node.params.length > 0 || node.returns) {
      el.append($$(Params, {params: node.params, returns: node.returns}));
    }
    if (node.members && node.members.length > 0) {
      // member index
      el.append($$(MemberIndexComponent, {node: node}));
      // class members
      el.append(
        $$('div').addClass('se-members')
          .append(this._renderMembers())
          .append(this.renderInheritedMembers(el))
      );
    }
    return el;
  };

  this.renderInheritedMembers = function() {
    var node = this.props.node;

    if (!node.parentClass) return;

    var doc = node.getDocument();
    var parent = doc.get(node.parentClass);
    if (!parent) return;

    var result = [];
    each(parent.members, function(id) {
      var member = doc.get(id);
      if (member.type === "method" && !member.isPrivate) {
        result.push(
          $$('div').addClass('se-inherited-method')
          .append($$(MethodComponent, {
            node: member,
            parentNode: node,
            inheritedFrom: parent.id
          }))
        );
      }
    });
    return result;
  };

};

oo.inherit(ClassComponent, DocumentationNodeComponent);

module.exports = ClassComponent;

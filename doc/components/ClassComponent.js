'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var DocumentationNodeComponent = require('./DocumentationNodeComponent');
var $$ = Component.$$;
var pluck = require('lodash/collection/pluck');
var each = require('lodash/collection/each');

var Params = require('./ParamsComponent');
var Heading = require('./HeadingComponent');
var MethodComponent = require('./MethodComponent');

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
    if(node.description) {
      el.append(
        $$('div').addClass('se-description').html(node.description)
      );
    }
    // constructor signature and parameter desciption
    el.append(
      $$('div').addClass('se-constructor sc-method')
        .append(this.renderSignature())
        .append($$(Params, {params: node.params}))
    );
    // class members
    el.append(
      $$('div').addClass('se-members')
        .append(this._renderMembers())
        .append(this.renderInheritedMembers(el))
    );
    // example
    if (node.example) {
      el.append($$('div').addClass('se-example').html(node.example));
    }
    return el;
  };

  this.renderSignature = function() {
    var paramSig = pluck(this.props.node.params, 'name').join(', ');
    var sig = ['new ', this.props.node.name, '(', paramSig, ')'];
    return $$('div').addClass('se-signature').append(
      $$('span').addClass('se-context').append('Constructor: '),
      $$('span').append(sig)
    );
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

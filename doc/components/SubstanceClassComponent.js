'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var ClassComponent = require('./ClassComponent');
var Params = require('./ParamsComponent');
var Example = require('./ExampleComponent');
var $$ = Component.$$;
var find = require('lodash/collection/find');

function SubstanceClassComponent() {
  ClassComponent.apply(this, arguments);
}

SubstanceClassComponent.Prototype = function() {

  this.isComponent = function() {
    var node = this.props.node;
    var isComponent = false;
    if (node.type === 'class' && node.tags.length > 0) {
      isComponent = !!find(node.tags, 'type', 'component');
    }
    return isComponent;
  };

  this.collectTagsByType = function(tagType) {
    var tagValues = [];
    this.props.node.tags.forEach(function(tag) {
      if (tag.type === tagType) {
        tagValues.push(tag.value);
      }
    });
    return tagValues;
  };
  
  this.renderUsage = function() {
    var node = this.props.node;
    var el = $$('div').addClass('se-usage');

    if (this.isComponent()) {
      var props = this.collectTagsByType('prop');
      var stateProps = this.collectTagsByType('state');
      if (props.length > 0) {
        el.append($$(Params, {label: 'props', params: props}));
      }
      if (stateProps.length > 0) {
        el.append($$(Params, {label: 'state', params: stateProps}));
      }
    }

    if (node.example) {
      el.append($$(Example, {node: node}));
    }
    return el;
  };
};

oo.inherit(SubstanceClassComponent, ClassComponent);
module.exports = SubstanceClassComponent;

'use strict';

var ClassComponent = require('./ClassComponent');
var Params = require('./ParamsComponent');
var Example = require('./ExampleComponent');

function SubstanceClassComponent() {
  SubstanceClassComponent.super.apply(this, arguments);
}

SubstanceClassComponent.Prototype = function() {

  this.renderUsage = function($$) {
    var node = this.props.node;
    var el = $$('div').addClass('se-usage');
    if (node.getSpecificType() === 'component') {
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

  this.collectTagsByType = function(tagType) {
    var tagValues = [];
    this.props.node.tags.forEach(function(tag) {
      if (tag.type === tagType) {
        tagValues.push(tag.value);
      }
    });
    return tagValues;
  };

};

ClassComponent.extend(SubstanceClassComponent);
module.exports = SubstanceClassComponent;

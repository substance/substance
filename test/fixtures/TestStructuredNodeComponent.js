'use strict';

var Component = require('../../ui/Component');
var TextPropertyEditor = require('../../ui/TextPropertyEditor');

function TestStructuredNodeComponent() {
  TestStructuredNodeComponent.super.apply(this, arguments);
}

TestStructuredNodeComponent.Prototype = function() {
  this.render = function($$) {
    var node = this.props.node;
    var el = $$('div').addClass('sc-structured-node');
    el.append(
      $$(TextPropertyEditor, {
        disabled: this.props.disabled,
        path: [node.id, 'title']
      }).ref('titleEditor')
    );
    el.append(
      $$(TextPropertyEditor, {
        disabled: this.props.disabled,
        path: [node.id, 'body']
      }).ref('bodyEditor')
    );
    el.append(
      $$(TextPropertyEditor, {
        disabled: this.props.disabled,
        path: [node.id, 'caption']
      }).ref('captionEditor')
    );
    return el;
  };
};

Component.extend(TestStructuredNodeComponent);

TestStructuredNodeComponent.static.fullWidth = true;

module.exports = TestStructuredNodeComponent;

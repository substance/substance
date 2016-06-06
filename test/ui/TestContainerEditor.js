"use strict";

var Component = require('../../ui/Component');
var ContainerEditor = require('../../ui/ContainerEditor');

function TestContainerEditor() {
  TestContainerEditor.super.apply(this, arguments);
}

TestContainerEditor.Prototype = function() {

  this.getChildContext = function() {
    return this.props.context;
  };

  this.render = function($$) {
    return $$('div').append(
      $$(ContainerEditor, {
        node: this.props.node,
        commands: [],
        textTypes: []
      }).ref('editor')
    );
  };
};

Component.extend(TestContainerEditor);

module.exports = TestContainerEditor;

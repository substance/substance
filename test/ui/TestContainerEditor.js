"use strict";

var DocumentSession = require('../../model/DocumentSession');
var ContainerEditor = require('../../ui/ContainerEditor');

function TestContainerEditor() {
  TestContainerEditor.super.apply(this, arguments);

  this.documentSession = new DocumentSession(this.props.doc);
}

TestContainerEditor.Prototype = function() {
  this.render = function($$) {
    return $$('div').append(
      $$(ContainerEditor, {
        documentSession: this.documentSession,
        containerId: 'main',
        name: 'main',
        commands: [],
        textTypes: []
      }).ref('editor')
    );
  };
};

module.exports = TestContainerEditor;

'use strict';
var Configurator = require('../../util/Configurator');
var FileClientStub = require('./FileClientStub');
var SaveHandlerStub = require('./SaveHandlerStub');

/*
  This works well for single-column apps (such as ProseEditor).
  Write your own Configurator for apps that require more complex
  configuration (e.g. when there are multiple surfaces involved
  each coming with different textTypes, enabled commands etc.)
*/
function ProseEditorConfigurator() {
  ProseEditorConfigurator.super.apply(this, arguments);

  // Extend configuration
  this.config.saveHandler = new SaveHandlerStub();
  this.config.fileClient = new FileClientStub();
  this.config.ToolbarClass = null;
}

ProseEditorConfigurator.Prototype = function() {

  this.setSaveHandler = function(saveHandler) {
    this.config.saveHandler = saveHandler;
  };

  this.setToolbarClass = function(ToolbarClass) {
    this.config.ToolbarClass = ToolbarClass;
  };

  this.setFileClient = function(fileClient) {
    this.config.fileClient = fileClient;
  };

  this.getFileClient = function() {
    return this.config.fileClient;
  };

  this.getSaveHandler = function() {
    return this.config.saveHandler;
  };

  this.getToolbarClass = function() {
    return this.config.ToolbarClass;
  };
};

Configurator.extend(ProseEditorConfigurator);

module.exports = ProseEditorConfigurator;
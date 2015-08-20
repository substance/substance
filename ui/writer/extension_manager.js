"use strict";

var OO = require("../../basics/oo");

var ExtensionManager = function(extensions, writer) {
  this.extensions = extensions;
  this.writer = writer;
};

ExtensionManager.Prototype = function() {

  // Get all available extensions
  this.getExtensions = function() {
    return this.extensions;
  };

  // Get all available tools from core and extensions
  this.getTools = function() {
    var extensions = this.extensions;
    var tools = [];

    for (var i = 0; i < extensions.length; i++) {
      var ext = extensions[i];
      if (ext.tools) {
        tools = tools.concat(ext.tools);
      }
    }
    return tools;
  };


  // Generic function to call a state handler
  // ---------------

  this.handle = function(handlerName) {
    var result = null;
    var extensions = this.extensions;

    for (var i = 0; i < extensions.length && !result; i++) {
      var stateHandlers = extensions[i].stateHandlers;
      if (stateHandlers && stateHandlers[handlerName]) {
        result = stateHandlers[handlerName](this.writer, arguments[1], arguments[2]); // .handleContextPanelCreation(this)
      }
    }
    return result;
  };


  this.handleSelectionChange = function(sel) {
    return this.handle("handleSelectionChange", sel);
  };

  this.handleAction = function(actionName) {
    return this.handle("handleAction", actionName);
  };

  this.handleAnnotationToggle = function(annotationId) {
    return this.handle("handleAnnotationToggle", annotationId);
  };

  this.handleStateChange = function(newState, oldState) {
    return this.handle("handleStateChange", newState, oldState);
  };

  // Based on a certain writer state, determine which nodes
  // should be highlighted in the scrollbar and in the document
  this.getHighlightedNodes = function() {
    var highlightedNodes = this.handle("getHighlightedNodes");
    return highlightedNodes || [];
  };

  // Desired implementation
  this.getActiveContainerAnnotations = function() {
    var activeContainerAnnotations = this.handle('getActiveContainerAnnotations');
    return activeContainerAnnotations || [];
  };

};

OO.initClass(ExtensionManager);

module.exports = ExtensionManager;

'use strict';

var OO = require('../../basics/oo');
var SurfaceCommand = require('./surface_command');
var _ = require('../../basics/helpers');

var SwitchTextType = function(surface) {
  SurfaceCommand.call(this, surface);
};

SwitchTextType.Prototype = function() {

  this.static = {
    name: 'switchTextType'
  };

  this.getSelection = function() {
    return this.getSurface().getSelection();
  };

  // Example result
  // 
  // {
  //   "type": "heading",
  //   "level": 2,
  // }
  this.getNodeData = function() {
    return this.constructor.static.nodeData;
  };

  // Example result
  // 
  // 'Codeblock'
  this.getTextTypeName = function() {
    return this.constructor.static.textTypeName;
  };

  this.getTextCommands = function() {
    var surface = this.getSurface();
    return surface.getTextCommands();
  };

  this.isTextType = function(type) {
    var isTextType = false;
    var textCommands = this.getTextCommands();
    _.each(textCommands, function(cmd) {
      if (cmd.constructor.static.nodeData.type === type) {
        isTextType = true;
      }
    });
    return isTextType;
  };

  this.getContext = function(parentNode, path) {
    if (parentNode.id === path[0]) {
      return path[1];
    } else {
      return parentNode.type;
    }
  };

  this.getCommandName = function(node) {
    if (this.isTextType(node.type)) {
      var textType = "make"+_.capitalize(node.type);
      if (node.type === "heading") {
        textType += node.level;
      }
      return textType;
    }
  };

  this.getCommandState = function() {
    console.log('get command state');
    var sel = this.getSelection();
    var surface = this.getSurface();

    var newState = {
      disabled: false,
      sel: sel
    };

    // Set disabled when not a property selection
    if (!surface.isEnabled() || sel.isNull()) {
      newState.disabled = true;
    } else if (sel.isTableSelection()) {
      newState.disabled = true;
      newState.currentContext = 'table';
    } else if (sel.isContainerSelection()) {
      newState.disabled = true;
      newState.currentContext = 'container';
    } else {
      var doc = this.getDocument();
      var path = sel.getPath();
      var node = doc.get(path[0]);

      if (node) {
        var currentCommand = this.getCommandName(node);
        var parentNode = node.getRoot();
        var currentContext = this.getContext(parentNode, path);

        // label/dropdown button
        // this is redundant, thus slow!
        var textCommands = this.getTextCommands();
        var isTextContext = textCommands[currentCommand];
        var label;
        if (isTextContext) {
          label = textCommands[currentCommand].constructor.static.textTypeName;
        } else if (currentContext) {
          label = currentContext;
        } else {
          label = 'No selection';
        }
        newState.label = label;
        newState.currentContext = currentContext;
        newState.currentCommand = currentCommand;        
      } else {
        newState.disabled = true;
      }

    }
    return newState;
  };

  // Execute command and trigger 
  this.execute = function() {
    var nodeData = this.getNodeData();
    var surface = this.getSurface();

    surface.transaction(function(tx, args) {
      args.data = nodeData;
      return surface.switchType(tx, args);
    });
    return nodeData;
  };
};

OO.inherit(SwitchTextType, SurfaceCommand);

module.exports = SwitchTextType;

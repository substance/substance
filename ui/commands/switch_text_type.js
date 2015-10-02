'use strict';

var OO = require('../../basics/oo');
var Command = require('./command');

var SwitchTextType = function(controller) {
  Command.call(this, controller);
};

SwitchTextType.Prototype = function() {
  this.getSelection = function() {
    return this.getSurface().getSelection();
  };

  // @example result
  // 
  // {
  //   "type": "heading",
  //   "level": 2,
  // }
  this.getNodeData = function() {
    return this.constructor.static.nodeData;
  };

  // @example result
  // 
  // 'Codeblock'
  this.getTextTypeName = function() {
    return this.constructor.static.textTypeName;
  };

  // Execute command and trigger 
  this.execute = function() {
    var nodeData = this.getNodeData();
    var surface = this.getSurface();
    var editor = surface.getEditor();

    surface.transaction(function(tx, args) {
      args.data = nodeData;
      return editor.switchType(tx, args);
    });

    return nodeData;
  };
};

OO.inherit(SwitchTextType, Command);

module.exports = SwitchTextType;

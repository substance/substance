'use strict';

var SurfaceCommand = require('./SurfaceCommand');
var insertNode = require('../model/transform/insertNode');

function InsertNodeCommand() {
  InsertNodeCommand.super.apply(this, arguments);
}

InsertNodeCommand.Prototype = function() {

  this.getCommandState = function() {
    var sel = this.getSelection();
    var newState = {
      disabled: true,
      active: false
    };
    if (sel && !sel.isNull() && sel.isPropertySelection()) {
      newState.disabled = false;
    }
    return newState;
  };

  this.execute = function() {
    var state = this.getCommandState();
    if (state.disabled) return;
    var surface = this.getSurface();
    surface.transaction(function(tx, args) {
      return this.insertNode(tx, args);
    }.bind(this));
    return true;
  };

  this.insertNode = function(tx, args) {
    args.node = this.createNodeData(tx, args);
    return insertNode(tx, args);
  };

  this.createNodeData = function(tx, args) {
    /* jshint unused:false */
    throw new Error('InsertNodeCommand.createNodeData() is abstract.');
  };
};


SurfaceCommand.extend(InsertNodeCommand);

module.exports = InsertNodeCommand;

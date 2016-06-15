'use strict';

var Command = require('./Command');
var insertNode = require('../model/transform/insertNode');

function InsertNodeCommand() {
  InsertNodeCommand.super.apply(this, arguments);
}

InsertNodeCommand.Prototype = function() {

  this.getCommandState = function(props, context) {
    var sel = context.documentSession.getSelection();
    var newState = {
      disabled: true,
      active: false
    };
    if (sel && !sel.isNull() && sel.isPropertySelection()) {
      newState.disabled = false;
    }
    return newState;
  };

  this.execute = function(props, context) {
    var state = this.getCommandState(props, context);
    if (state.disabled) return;
    var surface = context.surface ||context.surfaceManager.getFocusedSurface();
    if (surface) {
      surface.transaction(function(tx, args) {
        return this.insertNode(tx, args);
      }.bind(this));
    }
    return true;
  };

  this.insertNode = function(tx, args) {
    args.node = this.createNodeData(tx, args);
    return insertNode(tx, args);
  };

  this.createNodeData = function(tx, args) { // eslint-disable-line
    throw new Error('InsertNodeCommand.createNodeData() is abstract.');
  };
};

Command.extend(InsertNodeCommand);

module.exports = InsertNodeCommand;

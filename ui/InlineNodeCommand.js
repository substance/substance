'use strict';

var Command = require('./Command');
var insertInlineNode = require('../model/transform/insertInlineNode');

function InlineNodeCommand() {
  InlineNodeCommand.super.apply(this, arguments);
}

InlineNodeCommand.Prototype = function() {

  /**
    Get the type of an annotation.

    @returns {String} The annotation's type.
   */
  this.getAnnotationType = function() {
    // Note: AnnotationCommand.static.annotationType is only necessary if
    // it is different to Annotation.static.name
    var annotationType = this.constructor.static.annotationType || this.constructor.static.name;
    if (annotationType) {
      return annotationType;
    } else {
      throw new Error('Contract: AnnotationCommand.static.annotationType should be associated to a document annotation type.');
    }
  };

  this.getCommandState = function(props, context) {
    var sel = context.documentSession.getSelection();
    var newState = {
      disabled: true,
      active: false,
      node: undefined
    };

    if (sel && !sel.isNull() && sel.isPropertySelection()) {
      newState.disabled = false;
    }

    var annos = this._getAnnotationsForSelection(props, context);
    if (annos.length === 1) {
      newState.active = true;
      newState.node = annos[0];
    }

    return newState;
  };

  this._getAnnotationsForSelection = function(props) {
    return props.selectionState.getAnnotationsForType(this.getAnnotationType());
  };

  this.execute = function(props, context) {
    var state = this.getCommandState(props, context);
    if (state.disabled) return;
    var surface = context.surface ||context.surfaceManager.getFocusedSurface();
    if (surface) {
      surface.transaction(function(tx, args) {
        return this.insertInlineNode(tx, args);
      }.bind(this));
    }
    return true;
  };

  this.insertInlineNode = function(tx, args) {
    args.node = this.createNodeData(tx, args);
    return insertInlineNode(tx, args);
  };

  this.createNodeData = function(tx, args) { // eslint-disable-line
    throw new Error('InsertNodeCommand.createNodeData() is abstract.');
  };

};

Command.extend(InlineNodeCommand);

module.exports = InlineNodeCommand;
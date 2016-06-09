'use strict';

var oo = require('../util/oo');
var TreeIndex = require('../util/TreeIndex');
var Selection = require('./Selection');
var documentHelpers = require('./documentHelpers');

function SelectionState(doc) {
  this.document = doc;
  this._state = this._resetState();
}

SelectionState.Prototype = function() {

  this.setSelection = function(sel) {
    if (!sel) {
      sel = Selection.nullSelection;
    } else {
      sel.attach(this.document);
    }
    if (!this._state.selection.equals(sel)) {
      this._state.selection = sel;
      this._deriveState(sel);
      return true;
    }
    return false;
  };

  this.getSelection = function() {
    return this._state.selection;
  };

  this.getAnnotationsForType = function(type) {
    if (this.state.annos) {
      return this.state.annos.get(type);
    }
    return [];
  };

  this._deriveState = function(sel) {
    var doc = this.document;

    var state = this._resetState();
    state.selection = sel;

    if (sel.isContainerSelection()) {
      state.isNodeSelection = sel.isNodeSelection();
      if (state.isNodeSelection) {
        state.nodeId = sel.getNodeId();
        if (sel.isEntireNodeSelected()) {
          state.nodeSelectionMode = 'full';
        } else if (sel.startOffset === 0 && sel.endOffset === 0) {
          state.nodeSelectionMode = 'before';
        } else if (sel.startOffset === 1 && sel.endOffset === 1) {
          state.nodeSelectionMode = 'after';
        } else {
          throw new Error('Illegal selection state.');
        }
      }
    }

    // create a mapping by type for the currently selected annotations
    var annosByType = new TreeIndex.Arrays();
    var propAnnos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel);
    propAnnos.forEach(function(anno) {
      annosByType.add(anno.type, anno);
    });
    var containerId = sel.containerId;
    if (containerId) {
      var containerAnnos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, containerId);
      containerAnnos.forEach(function(anno) {
        annosByType.add(anno.type, anno);
      });
    }
    state.annos = annosByType;
  };

  this._resetState = function() {
    this._state = {
      selection: Selection.nullSelection,
      // all annotations under the current selection
      annos: null,
      // flags to make node selection (IsolatedNodes) stuff more convenient
      isNodeSelection: false,
      nodeId: null,
      nodeSelectionMode: '', // full, before, after
      // flags for inline nodes
      isInlineNodeSelection: false
    };
    return this._state;
  };

};

oo.initClass(SelectionState);

module.exports = SelectionState;

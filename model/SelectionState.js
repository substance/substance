'use strict';

import oo from '../util/oo'
import TreeIndex from '../util/TreeIndex'
import Selection from './Selection'
import documentHelpers from './documentHelpers'

function SelectionState(doc) {
  this.document = doc;

  this.selection = Selection.nullSelection;
  this._state = {};
  this._resetState();
}

SelectionState.Prototype = function() {

  this.setSelection = function(sel) {
    if (!sel) {
      sel = Selection.nullSelection;
    } else {
      sel.attach(this.document);
    }
    // TODO: selection state is selection plus derived state,
    // thus we need to return false only if both did not change
    this._deriveState(sel);
    this.selection = sel;
    return true;
  };

  this.getSelection = function() {
    return this.selection;
  };

  this.getAnnotationsForType = function(type) {
    var state = this._state;
    if (state.annosByType) {
      return state.annosByType.get(type) || [];
    }
    return [];
  };

  this.isInlineNodeSelection = function() {
    return this._state.isInlineNodeSelection;
  };

  this._deriveState = function(sel) {
    var doc = this.document;

    this._resetState();
    var state = this._state;

    // create a mapping by type for the currently selected annotations
    var annosByType = new TreeIndex.Arrays();
    var propAnnos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel);
    propAnnos.forEach(function(anno) {
      annosByType.add(anno.type, anno);
    });

    if (propAnnos.length === 1 && propAnnos[0].isInline()) {
      state.isInlineNodeSelection = propAnnos[0].getSelection().equals(sel);
    }

    var containerId = sel.containerId;
    if (containerId) {
      var containerAnnos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, containerId);
      containerAnnos.forEach(function(anno) {
        annosByType.add(anno.type, anno);
      });
    }
    state.annosByType = annosByType;
  };

  this._resetState = function() {
    this._state = {
      // all annotations under the current selection
      annosByType: null,
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

export default SelectionState;

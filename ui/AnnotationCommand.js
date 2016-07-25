'use strict';

var Command = require('./Command');
var createAnnotation = require('../model/transform/createAnnotation');
var fuseAnnotation = require('../model/transform/fuseAnnotation');
var expandAnnotation = require('../model/transform/expandAnnotation');
var truncateAnnotation = require('../model/transform/truncateAnnotation');

/**
  A class for commands intended to be executed on the annotations.
  See the example below to learn how to define a custom `AnnotationCommand`.

  @class
  @extends ui/Command

  @example

  ```js
  var AnnotationCommand = require('substance/ui/AnnotationCommand');

  function SmallCapsCommand() {
    SmallCaps.super.apply(this, arguments);
  }

  var SmallCapsCommand = AnnotationCommand.extend();

  SmallCapsCommand.nodeType = 'smallcaps';
  ```
*/
function AnnotationCommand(params) {
  AnnotationCommand.super.call(this, params);

  this.nodeType = this.params.nodeType;

  if (!this.nodeType) {
    throw new Error("'nodeType' is required");
  }
}

AnnotationCommand.Prototype = function() {

  /**
    Get the type of an annotation.

    @returns {String} The annotation's type.
   */
  this.getAnnotationType = function() {
    return this.nodeType;
  };

  /**
    Get the annotation's data.

    @returns {Object} The annotation's data.
   */
  this.getAnnotationData = function() {
    return {};
  };

  /**
    Checks if command couldn't be executed with current selection.

    @param {Array} annos annotations
    @param {Object} sel selection

    @returns {Boolean} Whether or not command could be executed.
   */
  this.isDisabled = function(sel) {
    // TODO: Container selections should be valid if the annotation type
    // is a container annotation. Currently we only allow property selections.
    if (!sel || sel.isNull() || !sel.isAttached() || sel.isCustomSelection()||
        sel.isNodeSelection() || sel.isContainerSelection()) {
      return true;
    }
    return false;
  };

  // Not implemented by default
  this.canEdit = function(annos, sel) { // eslint-disable-line
    return false;
  };

  /**
    Checks if new annotations could be created.
    There should be no annotation overlapping, selection must be not collapsed.

    @param {Array} annos annotations
    @param {Object} sel selection

    @returns {Boolean} Whether or not annotation could be created.
   */
  // When there's no existing annotation overlapping, we create a new one.
  this.canCreate = function(annos, sel) {
    return (annos.length === 0 && !sel.isCollapsed());
  };

  /**
    Checks if annotations could be fused.
    There should be more than one annotation overlaped by current selection.

    @param {Array} annos annotations
    @param {Object} sel selection

    @returns {Boolean} Whether or not annotations could be fused.
   */
  // When more than one annotation overlaps with the current selection
  this.canFuse = function(annos, sel) {
    return (annos.length >= 2 && !sel.isCollapsed());
  };

  /**
    Checks if annotation could be deleted.
    Cursor or selection must be inside an existing annotation.

    @param {Array} annos annotations
    @param {Object} sel selection

    @returns {Boolean} Whether or not annotation could be deleted.
   */
  // When the cursor or selection is inside an existing annotation
  this.canDelete = function(annos, sel) {
    if (annos.length !== 1) return false;
    var annoSel = annos[0].getSelection();
    return sel.isInsideOf(annoSel);
  };

  /**
    Checks if annotation could be expanded.
    There should be overlap with only a single annotation,
    selection should be also outside of this annotation.

    @param {Array} annos annotations
    @param {Object} sel selection

    @returns {Boolean} Whether or not annotation could be expanded.
   */
  // When there's some overlap with only a single annotation we do an expand
  this.canExpand = function(annos, sel) {
    if (annos.length !== 1) return false;
    var annoSel = annos[0].getSelection();
    return sel.overlaps(annoSel) && !sel.isInsideOf(annoSel);
  };

  /**
    Checks if annotation could be truncated.
    There should be overlap with only a single annotation,
    selection should also have boundary in common with this annotation.

    @param {Array} annos annotations
    @param {Object} sel selection

    @returns {Boolean} Whether or not annotation could be truncated.
   */
  this.canTruncate = function(annos, sel) {
    if (annos.length !== 1) return false;
    var annoSel = annos[0].getSelection();

    return (sel.isLeftAlignedWith(annoSel) || sel.isRightAlignedWith(annoSel)) &&
           !sel.contains(annoSel) &&
           !sel.isCollapsed();
  };

  /**
    Gets command state object.

    @param {Object} state.selection the current selection
    @returns {Object} info object with command details.
  */
  this.getCommandState = function(props, context) { // eslint-disable-line
    context = context || {};
    var sel = this._getSelection(props);
    // We can skip all checking if a disabled condition is met
    // E.g. we don't allow toggling of property annotations when current
    // selection is a container selection
    if (this.isDisabled(sel)) {
      return {
        disabled: true
      };
    }
    var annos = this._getAnnotationsForSelection(props, context);
    var newState = {
      disabled: false,
      active: false,
      mode: null
    };
    if (this.canCreate(annos, sel)) {
      newState.mode = "create";
    } else if (this.canFuse(annos, sel)) {
      newState.mode = "fusion";
    } else if (this.canTruncate(annos, sel)) {
      newState.active = true;
      newState.mode = "truncate";
    } else if (this.canExpand(annos, sel)) {
      newState.mode = "expand";
    } else if (this.canEdit(annos, sel)) {
      newState.mode = "edit";
      newState.node = annos[0];
      newState.active = true;
    } else if (this.canDelete(annos, sel)) {
      newState.active = true;
      newState.mode = "delete";
    } else {
      newState.disabled = true;
    }
    return newState;
  };

  /**
    Execute command and trigger transformation.

    @returns {Object} info object with execution details.
  */
  // Execute command and trigger transformations
  this.execute = function(props, context) {
    props = props || {};
    props.selection = this._getSelection(props);
    if (props.disabled) return false;
    var mode = props.mode;
    switch(mode) {
      case 'create':
        return this.executeCreate(props, context);
      case 'fuse':
        return this.executeFuse(props, context);
      case 'truncate':
        return this.executeTruncate(props, context);
      case 'expand':
        return this.executeExpand(props, context);
      case 'edit':
        return this.executeEdit(props, context);
      case 'delete':
        return this.executeDelete(props, context);
      default:
        console.warn('Command.execute(): unknown mode', mode);
        return false;
    }
  };

  this.executeCreate = function(props, context) {
    var annos = this._getAnnotationsForSelection(props, context);
    this._checkPrecondition(props, context, annos, this.canCreate);
    var newAnno = this._applyTransform(props, context, function(tx) {
      props.node = this.getAnnotationData();
      props.node.type = this.getAnnotationType();
      return createAnnotation(tx, props);
    }.bind(this));
    return {
      mode: 'create',
      anno: newAnno
    };
  };

  this.executeFuse = function(props, context) {
    var annos = this._getAnnotationsForSelection(props, context);
    this._checkPrecondition(props, context, annos, this.canFuse);
    var fusedAnno = this._applyTransform(props, context, function(tx) {
      var result = fuseAnnotation(tx, {
        annos: annos
      });
      return {
        result: result.node
      };
    });
    return {
      mode: 'fuse',
      anno: fusedAnno
    };
  };

  this.executeTruncate = function(props, context) {
    var annos = this._getAnnotationsForSelection(props, context);
    var anno = annos[0];
    this._checkPrecondition(props, context, annos, this.canTruncate);
    this._applyTransform(props, context, function(tx) {
      return truncateAnnotation(tx, {
        selection: props.selection,
        anno: anno
      });
    });
    return {
      mode: 'truncate',
      anno: anno
    };
  };

  this.executeExpand = function(props, context) {
    var annos = this._getAnnotationsForSelection(props, context);
    var anno = annos[0];
    this._checkPrecondition(props, context, annos, this.canExpand);
    this._applyTransform(props, context, function(tx) {
      expandAnnotation(tx, {
        selection: props.selection,
        anno: anno
      });
    });
    return {
      mode: 'expand',
      anno: anno
    };
  };

  // TODO: do we still need this?
  this.executeEdit = function(props, context) { // eslint-disable-line
    var annos = this._getAnnotationsForSelection(props, context);
    this._checkPrecondition(props, context, annos, this.canEdit);
    return {
      mode: "edit",
      anno: annos[0],
      readyOnly: true
    };
  };

  this.executeDelete = function(props, context) {
    var annos = this._getAnnotationsForSelection(props, context);
    var anno = annos[0];
    this._checkPrecondition(props, context, annos, this.canDelete);
    this._applyTransform(props, context, function(tx) {
      return tx.delete(anno.id);
    });
    return {
      mode: 'delete',
      annoId: anno.id
    };
  };

  this._checkPrecondition = function(props, context, annos, checker) {
    var sel = this._getSelection(props);
    if (!checker.call(this, annos, sel)) {
      throw new Error("AnnotationCommand: can't execute command for selection " + sel.toString());
    }
  };

  this._getAnnotationsForSelection = function(props) {
    return props.selectionState.getAnnotationsForType(this.getAnnotationType());
  };

  /**
    Apply an annotation transformation.

    @returns {Object} transformed annotations.
   */
  // Helper to trigger an annotation transformation
  this._applyTransform = function(props, context, transformFn) {
    // HACK: this looks a bit too flexible. Maybe we want to go for
    var sel = this._getSelection(props);
    var documentSession = this._getDocumentSession(props, context);
    var surface = props.surface;
    props.selection = sel;

    var result; // to store transform result
    if (sel.isNull()) return;
    documentSession.transaction(function(tx) {
      tx.before.selection = sel;
      if (surface) {
        tx.before.surfaceId = surface.getId();
      }
      var out = transformFn(tx, props);
      if (out) {
        result = out.result;
      }
      return out;
    });
    return result;
  };

};

Command.extend(AnnotationCommand);

module.exports = AnnotationCommand;

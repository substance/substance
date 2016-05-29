'use strict';

var Command = require('./Command');
var helpers = require('../model/documentHelpers');

// Annotation transformations
var createAnnotation = require('../model/transform/createAnnotation');
var fuseAnnotation = require('../model/transform/fuseAnnotation');
var expandAnnotation = require('../model/transform/expandAnnotation');
var truncateAnnotation = require('../model/transform/truncateAnnotation');
var deleteAnnotation = require('../model/transform/deleteAnnotation');

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

  SmallCapsCommand.static.name = 'smallcaps';
  ```
*/
var AnnotationCommand = function(surface) {
  Command.call(this, surface);
};

AnnotationCommand.Prototype = function() {

  /**
    Get the type of an annotation.

    @returns {String} The annotation's type.
   */
  this.getAnnotationType = function() {
    // NOTE: we never had a case where annotationType was not the same as the name
    // so we make AnnotationCommand.static.name default, which still can be
    // overridden using annotationType
    var annotationType = this.constructor.static.annotationType || this.constructor.static.name;
    if (annotationType) {
      return annotationType;
    } else {
      throw new Error('Contract: AnnotationCommand.static.annotationType should be associated to a document annotation type.');
    }
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
  this.isDisabled = function(context, annos, sel) {
    if (sel.isNull()) {
      return true;
    }
    var doc = context.documentSession.getDocument();
    var annotationType = this.getAnnotationType();
    return !helpers.isContainerAnnotation(doc, annotationType) && !sel.isPropertySelection();
  };

  // Not implemented by default
  this.canEdit = function(/*annos, sel*/) {
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
    Gets annotations for current selection.

    @returns {Array} annos Annotations.
   */
  this.getAnnotationsForSelection = function(context) {
    var sel = context.documentSession.getSelection();
    var doc = context.documentSession.getDocument();
    var surface = context.surfaceManager.getFocusedSurface();
    var annotationType = this.getAnnotationType();
    var containerId;
    if (surface.isContainerEditor()) {
      containerId = surface.getContainerId();
    }
    var annos = helpers.getAnnotationsForSelection(doc, sel, annotationType, containerId);
    return annos;
  };

  /**
    Execute command and trigger transformation.

    @returns {Object} info object with execution details.
   */
  // Execute command and trigger transformations
  this.execute = function(context) {
    var annos = this.getAnnotationsForSelection(context);
    var sel = context.documentSession.getSelection();

    if (this.isDisabled(context, annos, sel)) {
      return false;
    } else if (this.canCreate(annos, sel)) {
      return this.executeCreate(context);
    } else if (this.canFuse(annos, sel)) {
      return this.executeFuse(context);
    } else if (this.canTruncate(annos, sel)) {
      return this.executeTruncate(context);
    } else if (this.canExpand(annos, sel)) {
      return this.executeExpand(context);
    } else if (this.canEdit(annos, sel)) {
      return this.executeEdit(context, annos, sel);
    } else if (this.canDelete(annos, sel)) {
      return this.executeDelete(context);
    } else {
      // console.warn('ToggleAnnotation.execute: Case not handled.');
      return false;
    }
  };

  /**
    Gets command state object.

    @returns {Object} info object with command details.
   */
  this.getCommandState = function(context) {
    var sel = context.documentSession.getSelection();
    var surface = context.surfaceManager.getFocusedSurface();

    if (!surface) {
      return {
        disabled: true,
        active: false
      };
    }

    // TODO: provide annos precomputed by documentSession
    var annos = this.getAnnotationsForSelection(context);

    var newState = {
      disabled: false,
      active: false,
      mode: null
    };

    // We can skip all checking if a disabled condition is met
    // E.g. we don't allow toggling of property annotations when current
    // selection is a container selection
    if (this.isDisabled(context, annos, sel)) {
      newState.disabled = true;
    } else if (this.canCreate(annos, sel)) {
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
    Apply an annotation transformation.

    @returns {Object} transformed annotations.
   */
  // Helper to trigger an annotation transformation
  this.applyTransform = function(context, transformFn) {
    var surface = context.surfaceManager.getFocusedSurface();
    var sel = context.documentSession.getSelection();

    var result; // to store transform result
    if (sel.isNull()) return;

    surface.transaction(function(tx, args) {
      // Used by expand/truncate/fuse
      args.annotationType = this.getAnnotationType();

      // Used for createAnnotation transformation
      args.node = this.getAnnotationData();
      // For backwards compatibility: In future type should be
      // provided with getAnnotationData
      if (!args.node.type) {
        args.node.type = this.getAnnotationType();
      }

      args.splitContainerSelections = false;

      if (surface.isContainerEditor()) {
        args.containerId = surface.getContainerId();
      }

      args = transformFn(tx, args);
      result = args.result;
      return args;
    }.bind(this));

    return result;
  };

  this.executeEdit = function(context) {
    var annos = this.getAnnotationsForSelection(context);
    return {
      mode: "edit",
      anno: annos[0],
      readyOnly: true
    };
  };

  this.executeCreate = function(context) {
    var anno = this.applyTransform(context, createAnnotation);
    return {
      mode: 'create',
      anno: anno
    };
  };

  this.executeFuse = function(context) {
    var anno = this.applyTransform(context, fuseAnnotation);
    return {
      mode: 'fuse',
      anno: anno
    };
  };

  this.executeTruncate = function(context) {
    var anno = this.applyTransform(context, truncateAnnotation);
    return {
      mode: 'truncate',
      anno: anno
    };
  };

  this.executeExpand = function(context) {
    var anno = this.applyTransform(context, expandAnnotation);
    return {
      mode: 'expand',
      anno: anno
    };
  };

  this.executeDelete = function(context) {
    var annoId = this.applyTransform(context, deleteAnnotation);
    return {
      mode: 'delete',
      annoId: annoId
    };
  };

};

Command.extend(AnnotationCommand);

module.exports = AnnotationCommand;

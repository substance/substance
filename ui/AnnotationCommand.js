'use strict';

var SurfaceCommand = require('./SurfaceCommand');
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
  @extends ui/SurfaceCommand

  @example

  ```js
  var AnnotationCommand = require('substance/ui/AnnotationCommand');

  function SmallCapsCommand() {
    SmallCaps.super.apply(this, arguments);
  }

  var SmallCapsCommand = AnnotationCommand.extend();

  SmallCapsCommand.static.name = 'smallcaps';
  SmallCapsCommand.static.annotationType = 'smallcaps';
  ```
*/
var AnnotationCommand = function(surface) {
  SurfaceCommand.call(this, surface);
};

AnnotationCommand.Prototype = function() {

  /**
    Get the type of an annotation.

    @returns {String} The annotation's type.
   */
  this.getAnnotationType = function() {
    if (this.constructor.static.annotationType) {
      return this.constructor.static.annotationType;
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
  this.isDisabled = function(annos, sel) {
    // var surface = this.getSurface();
    // if ((!surface.isEnabled()) || sel.isNull()) {
    //   return true;
    // }

    if (sel.isNull()) {
      return true;
    }

    var annotationType = this.getAnnotationType();
    var doc = this.getDocument();
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
  this.getAnnotationsForSelection = function() {
    var sel = this.getSelection();
    var doc = this.getDocument();
    var surface = this.getSurface();
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
  this.execute = function() {
    var annos = this.getAnnotationsForSelection();
    var sel = this.getSelection();

    if (this.isDisabled(annos, sel)) {
      return false;
    } else if (this.canCreate(annos, sel)) {
      return this.executeCreate();
    } else if (this.canFuse(annos, sel)) {
      return this.executeFuse();
    } else if (this.canTruncate(annos, sel)) {
      return this.executeTruncate();
    } else if (this.canExpand(annos, sel)) {
      return this.executeExpand();
    } else if (this.canEdit(annos, sel)) {
      return this.executeEdit(annos, sel);
    } else if (this.canDelete(annos, sel)) {
      return this.executeDelete();
    } else {
      // console.warn('ToggleAnnotation.execute: Case not handled.');
      return false;
    }
  };

  /**
    Gets command state object.

    @returns {Object} info object with command details.
   */
  this.getCommandState = function() {
    var sel = this.getSelection();
    var annos = this.getAnnotationsForSelection();

    var newState = {
      disabled: false,
      active: false,
      mode: null
    };

    // We can skip all checking if a disabled condition is met
    // E.g. we don't allow toggling of property annotations when current
    // selection is a container selection
    if (this.isDisabled(annos, sel)) {
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
  this.applyTransform = function(transformFn) {
    var surface = this.getSurface();
    var sel = this.getSelection();

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

  this.executeEdit = function() {
    var annos = this.getAnnotationsForSelection();
    return {
      mode: "edit",
      anno: annos[0],
      readyOnly: true
    };
  };

  this.executeCreate = function() {
    var anno = this.applyTransform(createAnnotation);
    return {
      mode: 'create',
      anno: anno
    };
  };

  this.executeFuse = function() {
    var anno = this.applyTransform(fuseAnnotation);
    return {
      mode: 'fuse',
      anno: anno
    };
  };

  this.executeTruncate = function() {
    var anno = this.applyTransform(truncateAnnotation);
    return {
      mode: 'truncate',
      anno: anno
    };
  };

  this.executeExpand = function() {
    var anno = this.applyTransform(expandAnnotation);
    return {
      mode: 'expand',
      anno: anno
    };
  };

  this.executeDelete = function() {
    var annoId = this.applyTransform(deleteAnnotation);
    return {
      mode: 'delete',
      annoId: annoId
    };
  };

};

SurfaceCommand.extend(AnnotationCommand);

module.exports = AnnotationCommand;

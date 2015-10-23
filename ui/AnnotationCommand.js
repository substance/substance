'use strict';

var OO = require('../util/oo');
var SurfaceCommand = require('./SurfaceCommand');
var helpers = require('../model/documentHelpers');

// Annotation transformations
var createAnnotation = require('../model/transformations/create_annotation');
var fuseAnnotation = require('../model/transformations/fuse_annotation');
var expandAnnotation = require('../model/transformations/expand_annotation');
var truncateAnnotation = require('../model/transformations/truncate_annotation');
var deleteAnnotation = require('../model/transformations/delete_annotation');

var AnnotationCommand = function(surface) {
  SurfaceCommand.call(this, surface);
};

AnnotationCommand.Prototype = function() {

  this.getAnnotationType = function() {
    if (this.constructor.static.annotationType) {
      return this.constructor.static.annotationType;
    } else {
      throw new Error('Contract: AnnotationCommand.static.annotationType should be associated to a document annotation type.');
    }
  };

  this.getAnnotationData = function() {
    return {};
  };

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

  // When there's no existing annotation overlapping, we create a new one.
  this.canCreate = function(annos, sel) {
    return (annos.length === 0 && !sel.isCollapsed());
  };

  // When more than one annotation overlaps with the current selection
  this.canFuse = function(annos, sel) {
    return (annos.length >= 2 && !sel.isCollapsed());
  };

  // When the cursor or selection is inside an existing annotation
  this.canDelete = function(annos, sel) {
    if (annos.length !== 1) return false;
    var annoSel = annos[0].getSelection();
    return sel.isInsideOf(annoSel);
  };

  // When there's some overlap with only a single annotation we do an expand
  this.canExpand = function(annos, sel) {
    if (annos.length !== 1) return false;
    var annoSel = annos[0].getSelection();
    return sel.overlaps(annoSel) && !sel.isInsideOf(annoSel);
  };

  this.canTruncate = function(annos, sel) {
    if (annos.length !== 1) return false;
    var annoSel = annos[0].getSelection();
    return (sel.isLeftAlignedWith(annoSel) || sel.isRightAlignedWith(annoSel)) && !sel.equals(annoSel) && !sel.isCollapsed();
  };

  this.getAnnotationsForSelection = function() {
    var sel = this.getSelection();
    var doc = this.getDocument();
    var containerId = this.getContainerId();
    var annotationType = this.getAnnotationType();
    var annos = helpers.getAnnotationsForSelection(doc, sel, annotationType, containerId);
    return annos;
  };

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
      newState.annotationId = annos[0].id;
      newState.active = true;
    } else if (this.canDelete(annos, sel)) {
      newState.active = true;
      newState.mode = "delete";
    } else {
      newState.disabled = true;
    }
    return newState;
  };

  // Helper to trigger an annotation transformation
  this.applyTransform = function(transformFn) {
    var surface = this.getSurface();
    var sel = this.getSelection();
    var self = this;

    var result; // to store transform result
    if (sel.isNull()) return;

    // VERIFY: When the transform function to this there's an error with PhantomJS
    // E.g. like this: function(tx.args) {}.bind(this)
    // We use a self reference for now.
    surface.transaction({ selection: sel }, function(tx, args) {
      args.annotationType = self.getAnnotationType();
      args.annotationData = self.getAnnotationData();
      args.splitContainerSelections = false;
      args.containerId = self.getContainerId();

      args = transformFn(tx, args);
      result = args.result;
      return args;
    });

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

OO.inherit(AnnotationCommand, SurfaceCommand);

module.exports = AnnotationCommand;

'use strict';

var OO = require('../../basics/oo');
var Command = require('./command');
var helpers = require('../../document/helpers');

// Annotation transformations
var createAnnotation = require('../../document/transformations/create_annotation');
var fuseAnnotation = require('../../document/transformations/fuse_annotation');
var expandAnnotation = require('../../document/transformations/expand_annotation');
var truncateAnnotation = require('../../document/transformations/truncate_annotation');
var deleteAnnotation = require('../../document/transformations/delete_annotation');

var ToggleAnnotationCommand = function(surface) {
  Command.call(this, surface);
};

ToggleAnnotationCommand.Prototype = function() {

  this.getSelection = function() {
    return this.getSurface().getSelection();
  };

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

  // No-op hook implementations
  this.afterCreate = function() {};
  this.afterFuse = function() {};
  this.afterDelete = function() {};
  this.afterTruncate = function() {};
  this.afterExpand = function() {};

  // TODO: We had a concept when we allowed this situation by splitting the
  // container selection into multiple property selection
  // We would this now to be a concept on command level
  this.isDisabled = function(annos, sel) {
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
    var surface = this.getSurface();
    var sel = surface.getSelection();
    var doc = this.getDocument();
    var containerId = this.getSurface().getEditor().getContainerId();
    var annotationType = this.getAnnotationType();
    var annos = helpers.getAnnotationsForSelection(doc, sel, annotationType, containerId);
    return annos;
  };

  // Execute command and trigger transformations
  this.execute = function() {
    var annos = this.getAnnotationsForSelection();
    var sel = this.getSelection();

    if (this.canCreate(annos, sel)) {
      this.executeCreate();
    } else if (this.canFuse(annos, sel)) {
      this.executeFusion();
    } else if (this.canTruncate(annos, sel)) {
      this.executeTruncate();
    } else if (this.canExpand(annos, sel)) {
      this.executeExpand();
    } else if (this.canEdit(annos, sel)) {
      this.executeEdit(annos, sel);
    } else if (this.canDelete(annos, sel)) {
      this.executeDelete();
    }
  };

  // Helper to trigger an annotation transformation
  this.applyTransform = function(transformFn) {
    var surface = this.getSurface();
    var sel = surface.getSelection();
    var result; // to store transform result
    if (sel.isNull()) return;

    surface.transaction({ selection: sel }, function(tx, args) {
      args.annotationType = this.getAnnotationType();
      args.annotationData = this.getAnnotationData();
      args.splitContainerSelections = false;
      args.containerId = surface.getContainerId();

      args = transformFn(tx, args);
      result = args.result;
      return args;
    }, this);

    return result;
  };

  this.executeEdit = function() {
    throw new Error('Contract: executeEdit must be imlemented by command');
  };

  this.executeCreate = function() {
    var anno = this.applyTransform(createAnnotation);
    this.afterCreate(anno);
  };

  this.executeFuse = function() {
    var anno = this.applyTransform(fuseAnnotation);
    this.afterFuse(anno);
  };

  this.executeTruncate = function() {
    var anno = this.applyTransform(truncateAnnotation);
    this.afterTruncate(anno);
  };

  this.executeDelete = function() {
    var annoId = this.applyTransform(deleteAnnotation);
    this.afterDelete(annoId);
  };

  this.executeExpand = function() {
    var anno = this.applyTransform(expandAnnotation);
    this.afterExpand(anno);
  };
};

OO.inherit(ToggleAnnotationCommand, Command);

module.exports = ToggleAnnotationCommand;

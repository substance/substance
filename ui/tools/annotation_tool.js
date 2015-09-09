'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var SurfaceTool = require('./surface_tool');
var _ = require('../../basics/helpers');

/**
 * Abstract class for annotation tools like StrongTool, EmphasisTool
 * 
 * Implements the SurfaceTool API.
 */

function AnnotationTool() {
  SurfaceTool.apply(this, arguments);
}

AnnotationTool.Prototype = function() {

  // Tool Logic
  // --------------------------

  // blacklist of modes; one of 'create', 'remove', 'truncate', 'expand', 'fusion'
  this.disabledModes = [];

  this.splitContainerSelections = false;

  // Provides the type of the associated annotation node.
  // The default implementation uses the Tool's static name.
  // Override this method to customize.
  this.getAnnotationType = function() {
    if (this.constructor.static.name) {
      return this.constructor.static.name;
    } else {
      throw new Error('Contract: AnnotationTool.static.name should be associated to a document annotation type.');
    }
  };

  this.afterCreate = function() {};

  this.afterFusion = function() {};

  this.afterRemove = function() {};

  this.afterTruncate = function() {};

  this.afterExpand = function() {};

  // When there's no existing annotation overlapping, we create a new one.
  this.canCreate = function(annos, sel) {
    return (annos.length === 0 && !sel.isCollapsed());
  };

  // When more than one annotation overlaps with the current selection
  this.canFusion = function(annos, sel) {
    return (annos.length >= 2 && !sel.isCollapsed());
  };

  // When the cursor or selection is inside an existing annotation
  this.canRemove = function(annos, sel) {
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

  this.update = function(sel, surface) {
    
    if ((!surface.isEnabled()) || sel.isNull() ) {
      return this.setDisabled();
    }
    var doc = this.getDocument();
    var annotationType = this.getAnnotationType();
    var isContainerAnno = this.isContainerAnno();

    // Extract range and matching annos of current selection
    var annos;
    if (isContainerAnno) {
      annos = doc.getContainerAnnotationsForSelection(sel, this.getContainer(), {
        type: annotationType
      });
    } else {
      // Don't react on container selections if the associated annotation type
      // is a property annotation.
      // In future we could introduce a multi-annotation (multiple property selections)
      // and create multiple annotations at once.
      if (!sel.isPropertySelection() && !this.splitContainerSelections) {
        return this.setDisabled();
      }
      annos = doc.getAnnotationsForSelection(sel, { type: annotationType });
    }

    var newState = {
      surface: surface,
      disabled: false,
      active: false,
      mode: null,
      sel: sel,
      annos: annos
    };

    if (this.canCreate(annos, sel)) {
      newState.mode = "create";
    } else if (this.canFusion(annos, sel)) {
      newState.mode = "fusion";
    } else if (this.canTruncate(annos, sel)) {
      newState.active = true;
      newState.mode = "truncate";
    } else if (this.canRemove(annos, sel)) {
      newState.active = true;
      newState.mode = "remove";
    } else if (this.canExpand(annos, sel)) {
      newState.mode = "expand";
    }

    // Verifies if the detected mode has been disabled by the concrete implementation
    if (!newState.mode || _.includes(this.disabledModes, newState.mode)) {
      return this.setDisabled();
    } else {
      this.setState(newState);
    }
  };

  this.performAction = function() {
    var state = this.getState();

    // TODO: is this really necessary? better just check if the toolstate does not have a proper mode
    if (!state.sel || !state.mode || state.sel.isNull()) return;
    switch (state.mode) {
      case "create":
        return this.handleCreate(state);
      case "fusion":
        return this.handleFusion(state);
      case "remove":
        return this.handleRemove(state);
      case "truncate":
        return this.handleTruncate(state);
      case "expand":
        return this.handleExpand(state);
    }
  };

  this.handleCreate = function(state) {
    var sel = state.sel;
    var anno;

    if (sel.isNull()) return;
    this.getSurface().transaction({ selection: sel }, function(tx, args) {
      anno = this.createAnnotationForSelection(tx, sel);
      return args;
    }, this);
    this.afterCreate(anno);
  };

  this.getAnnotationData = function() {
    return {};
  };

  this.isContainerAnno = function() {
    var doc = this.getDocument();
    var schema = doc.getSchema();
    return schema.isInstanceOf(this.getAnnotationType(), "container_annotation");
  };

  this._createPropertyAnnotations = function(tx, sel) {
    var sels;
    var annotationType = this.getAnnotationType();
    if (sel.isPropertySelection()) {
      sels = [];
    } else if (sel.isContainerSelection()) {
      sels = sel.splitIntoPropertySelections();
    }
    for (var i = 0; i < sels.length; i++) {
      var anno = {
        id: _.uuid(annotationType),
        type: annotationType
      };
      _.extend(anno, this.getAnnotationData());
      anno.path = sels[i].getPath();
      anno.startOffset = sels[i].getStartOffset();
      anno.endOffset = sels[i].getEndOffset();
      tx.create(anno);
    }
  };

  this.createAnnotationForSelection = function(tx, sel) {
    if (this.splitContainerSelections && sel.isContainerSelection()) {
      return this._createPropertyAnnotations(tx, sel);
    }
    var annotationType = this.getAnnotationType();
    var anno = {
      id: _.uuid(annotationType),
      type: annotationType,
    };
    _.extend(anno, this.getAnnotationData());
    if (this.isContainerAnno()) {
      anno.startPath = sel.start.path;
      anno.endPath = sel.end.path;

      // Assuming that this branch only gets reached when the surface has a container
      // editor attached, we can ask this editor for the containerId
      var containerId = this.getSurface().getEditor().getContainerId();
      if (!containerId) throw "Container could not be determined";
      anno.container = containerId;
    } else if (sel.isPropertySelection()) {
      anno.path = sel.getPath();
    } else {
      throw new Error('Illegal state: can not apply ContainerSelection');
    }
    anno.startOffset = sel.getStartOffset();
    anno.endOffset = sel.getEndOffset();
    // start the transaction with an initial selection
    return tx.create(anno);
  };

  this.handleFusion = function(state) {
    var sel = state.sel;
    this.getSurface().transaction({ selection: sel }, function(tx, args) {
      _.each(state.annos, function(anno) {
        sel = sel.expand(anno.getSelection());
      });
      _.each(state.annos, function(anno) {
        tx.delete(anno.id);
      });
      this.createAnnotationForSelection(tx, sel);
      this.afterFusion();
      args.selection = sel;
      return args;
    }, this);
  };

  this.handleRemove = function(state) {
    var sel = state.sel;
    this.getSurface().transaction({ selection: sel }, function(tx, args) {
      var annoId = state.annos[0].id;
      tx.delete(annoId);
      this.afterRemove();
      return args;
    }, this);
  };

  this.handleTruncate = function(state) {
    var sel = state.sel;
    this.getSurface().transaction({ selection: sel }, function(tx, args) {
      var anno = state.annos[0];
      var annoSel = anno.getSelection();
      var newAnnoSel = annoSel.truncate(sel);
      anno.updateRange(tx, newAnnoSel);
      this.afterTruncate();
      return args;
    }, this);
  };

  this.handleExpand = function(state) {
    var sel = state.sel;
    this.getSurface().transaction({ selection: sel }, function(tx, args) {
      var anno = state.annos[0];
      var annoSel = anno.getSelection();
      var newAnnoSel = annoSel.expand(sel);
      anno.updateRange(tx, newAnnoSel);
      this.afterExpand();
      return args;
    }, this);
  };


  // UI-specific
  // --------------------------

  this.render = function() {
    var title = this.props.title || _.capitalize(this.getAnnotationType());

    if (this.state.mode) {
      title = [_.capitalize(this.state.mode), title].join(' ');
    }

    var el = $$("button")
      .attr('title', title)
      .addClass('button tool')
      .on('mousedown', this.onMouseDown)
      .on('click', this.onClick);

    if (this.state.disabled) {
      el.addClass('disabled');
    }
    if (this.state.active) {
      el.addClass('active');
    }
    if (this.state.mode) {
      el.addClass(this.state.mode);
    }

    el.append(this.props.children);
    return el;
  };

  this.onClick = function(e) {
    e.preventDefault();
  };

  this.onMouseDown = function(e) {
    e.preventDefault();
    if (this.state.disabled) {
      return;
    }
    this.performAction();
  };
};

OO.inherit(AnnotationTool, SurfaceTool);

module.exports = AnnotationTool;

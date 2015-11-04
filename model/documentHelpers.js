'use strict';

var _ = require('../util/helpers');
var AnnotationIndex = require('./AnnotationIndex');

// HACK: this is actually not a class thus @class is wrong, but I did not find
//  any other way to associate a function collection to a module.

/**
  @class documentHelpers
  @memberof module:model
  @example

  var documentHelpers = require('substance/model/documentHelpers');
  documentHelpers.isContainerAnnotation  
*/
var documentHelpers = {};

/**
  Returns true if given type is a container selection
  
  @static
  @memberof module:model
  @param {Document} doc
  @param {string} type
*/
documentHelpers.isContainerAnnotation = function(doc, type) {
  var schema = doc.getSchema();
  return schema.isInstanceOf(type, 'container-annotation');
};

/**
  For a given selection get all property annotations

  @static
  @memberof module:model
  @param {Document} doc
  @param {Document.Selection} sel
  @return An array of property annotations
  
  WARNING: Returns an empty array when selection is a container selection
*/
documentHelpers.getPropertyAnnotationsForSelection = function(doc, sel, options) {
  options = options || {};
  var annotations;
  var path, startOffset, endOffset;

  if (sel.isPropertySelection()) {
    path = sel.getPath();
    startOffset = sel.getStartOffset();
    endOffset = sel.getEndOffset();
  } else {
    return [];
  }

  annotations = doc.getIndex('annotations').get(path, startOffset, endOffset);
  if (options.type) {
    annotations = _.filter(annotations, AnnotationIndex.filterByType(options.type));
  }
  return annotations;
};

/**
  For a given selection get all container annotations

  @static
  @memberof module:model
  @param {Document} doc
  @param {Document.Selection} sel
  @param {Document.Container} container
  @param {object} options
  @return An array of container annotations
  
  ATTENTION: looking for container annotations is not as efficient as property
  selections, as we do not have an index that has notion of the spatial extend
  of an annotation (which would depend on a model-side implementation of
  Container). Opposed to that, common annotations are bound to properties
  which make it easy to lookup.
*/
documentHelpers.getContainerAnnotationsForSelection = function(doc, sel, container, options) {
  if (!container) {
    // Fail more silently
    return [];
    // throw new Error('Container required.');
  }
  var annotations;
  // Also look for container annotations if a Container instance is given
  if (options.type) {
    annotations = doc.getIndex('type').get(options.type);
  } else {
    annotations = doc.getIndex('container-annotation-anchors').byId;
  }
  annotations = _.filter(annotations, function(anno) {
    var annoSel = anno.getSelection();
    return sel.overlaps(annoSel);
  });
  return annotations;
};

/**
  For a given selection, get annotations of a certain type
  
  @static
  @memberof module:model
  @param {Document} doc
  @param {Document.Selection} sel
  @param {String} annotationType
  @param {String} containerId (only needed when type is a container annotation)
  @return {Array} all matching annotations
*/
documentHelpers.getAnnotationsForSelection = function(doc, sel, annotationType, containerId) {
  var annos;
  var isContainerAnno = Helpers.isContainerAnnotation(doc, annotationType);

  if (isContainerAnno) {
    var container = doc.get(containerId);
    annos = Helpers.getContainerAnnotationsForSelection(doc, sel, container, {
      type: annotationType
    });
  } else {
    annos = Helpers.getPropertyAnnotationsForSelection(doc, sel, { type: annotationType });
  }
  return annos;
};

/**
  For a given selection, get the corresponding text string
  
  @static
  @memberof module:model
  @param {Document} doc
  @param {Document.Selection} sel
  @return {String} text enclosed by the annotation
*/

documentHelpers.getTextForSelection = function(doc, sel) {
  var result = [];
  var text;
  if (!sel || sel.isNull()) {
    return "";
  } else if (sel.isPropertySelection()) {
    text = doc.get(sel.start.path);
    result.push(text.substring(sel.start.offset, sel.end.offset));
  } else if (sel.isContainerSelection()) {
    var container = doc.get(sel.containerId);
    var range = sel.range;
    var paths = container.getPathRange(range.start.path, range.end.path);
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      text = doc.get(path);
      if (paths.length === 1) {
        result.push(text.substring(sel.start.offset, sel.end.offset));
      } else if (i===0) {
        result.push(text.substring(sel.start.offset));
      } else if (i===paths.length-1) {
        result.push(text.substring(0, sel.end.offset));
      } else {
        result.push(text);
      }
    }
  }
  return result.join('');
};

module.exports = documentHelpers;
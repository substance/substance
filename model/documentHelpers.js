'use strict';

var filter = require('lodash/filter');
var AnnotationIndex = require('./AnnotationIndex');

/**
  @module
  @example

  ```js
  var documentHelpers = require('substance/model/documentHelpers');
  documentHelpers.isContainerAnnotation(doc, 'comment')
  ```
*/
var documentHelpers = {};

/**
  @param {model/Document} doc
  @param {String} type
  @return {Boolean} `true` if given type is a {@link model/ContainerAnnotation}
*/
documentHelpers.isContainerAnnotation = function(doc, type) {
  var schema = doc.getSchema();
  return schema.isInstanceOf(type, 'container-annotation');
};

/**
  For a given selection get all property annotations

  @param {model/Document} doc
  @param {model/Selection} sel
  @return {model/PropertyAnnotation[]} An array of property annotations.
          Returns an empty array when selection is a container selection.
*/
documentHelpers.getPropertyAnnotationsForSelection = function(doc, sel, options) {
  options = options || {};
  if (!sel.isPropertySelection()) {
    return [];
  }
  var annotations = doc.getIndex('annotations').get(sel.path, sel.startOffset, sel.endOffset);
  if (options.type) {
    annotations = filter(annotations, AnnotationIndex.filterByType(options.type));
  }
  return annotations;
};

/**
  For a given selection get all container annotations

  @param {model/Document} doc
  @param {model/Selection} sel
  @param {model/Container} container
  @param {object} options
  @return {Array} An array of container annotations
*/
documentHelpers.getContainerAnnotationsForSelection = function(doc, sel, container, options) {
  // ATTENTION: looking for container annotations is not as efficient as property
  // selections, as we do not have an index that has notion of the spatial extend
  // of an annotation (which would depend on a model-side implementation of
  // Container). Opposed to that, common annotations are bound to properties
  // which make it easy to lookup.
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
  annotations = filter(annotations, function(anno) {
    var annoSel = anno.getSelection();
    return sel.overlaps(annoSel);
  });
  return annotations;
};

/**
  For a given selection, get annotations of a certain type

  @param {Document} doc
  @param {Document.Selection} sel
  @param {String} annotationType
  @param {String} containerId (only needed when type is a container annotation)
  @return {Array} all matching annotations
*/
documentHelpers.getAnnotationsForSelection = function(doc, sel, annotationType, containerId) {
  var annos;
  var isContainerAnno = documentHelpers.isContainerAnnotation(doc, annotationType);

  if (isContainerAnno) {
    var container = doc.get(containerId);
    annos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, container, {
      type: annotationType
    });
  } else {
    annos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel, { type: annotationType });
  }
  return annos;
};

/**
  For a given selection, get the corresponding text string

  @param {Document} doc
  @param {model/Selection} sel
  @return {String} text enclosed by the annotation
*/

documentHelpers.getTextForSelection = function(doc, sel) {
  var text;
  if (!sel || sel.isNull()) {
    return "";
  } else if (sel.isPropertySelection()) {
    text = doc.get(sel.start.path);
    return text.substring(sel.start.offset, sel.end.offset);
  } else if (sel.isContainerSelection()) {
    var result = [];
    var container = doc.get(sel.containerId);
    var paths = container.getPathRange(sel.startPath, sel.endPath);
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      text = doc.get(path);
      if (paths.length === 1) {
        result.push(text.substring(sel.startOffset, sel.endOffset));
      } else if (i===0) {
        result.push(text.substring(sel.startOffset));
      } else if (i===paths.length-1) {
        result.push(text.substring(0, sel.endOffset));
      } else {
        result.push(text);
      }
    }
    return result.join('\n');
  }
};

module.exports = documentHelpers;
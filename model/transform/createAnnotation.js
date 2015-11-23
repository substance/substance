"use strict";
/* jshint latedef: false */

var extend = require('lodash/object/extend');
var uuid = require('../../util/uuid');
var helpers = require('../documentHelpers');

/**
  For a given container selection create property selections of a given type

  @function

  @param {model/TransactionDocument} tx the document instance
  @param {Object} args object with transformation arguments `selection`, `containerId`, `annotationType` and `annotationData`
  @scopedparam {model/Selection} args.selection A document selection
  @scopedparam {String} args.containerId a valid container id
  @scopedparam {String} args.annotationType type of the new annotation
  @scopedparam {Object} [args.annotationData] additional data that should be stored on the object

  @example

  ```js
  createAnnotation(tx, {
    selection: bodyEditor.getSelection(),
    annoType: 'link',
    containerId: bodyEditor.getContainerId(),
    annoData: {url: 'http://example.com'}
  });
  ```
*/

function createAnnotation(tx, args) {
  var sel = args.selection;
  var annoType = args.annotationType;
  var annoData = args.annotationData;
  var containerId = args.containerId;

  if (!sel) {
    throw new Error('selection is required.');
  }

  if (!annoType) {
    throw new Error('annotationType is required');
  }

  if (sel.isContainerSelection() && !containerId) {
    throw new Error('containerId must be provided for container selections');
  }

  // Special case: We split the current container selection into
  // multiple property annotations
  if (args.splitContainerSelections && sel.isContainerSelection()) {
    return _createPropertyAnnotations(tx, args);
  }

  var anno = {
    id: uuid(annoType),
    type: annoType,
  };
  extend(anno, annoData);

  if (helpers.isContainerAnnotation(tx, annoType)) {
    anno.startPath = sel.start.path;
    anno.endPath = sel.end.path;
    anno.container = containerId;
  } else if (sel.isPropertySelection()) {
    anno.path = sel.getPath();
  } else {
    throw new Error('Illegal state: can not apply ContainerSelection');
  }
  anno.startOffset = sel.getStartOffset();
  anno.endOffset = sel.getEndOffset();
  // start the transaction with an initial selection
  args.result = tx.create(anno);
  return args;
}

function _createPropertyAnnotations(tx, args) {
  var sel = args.selection;
  var annoType = args.annotationType;
  var annoData = args.annotationData;

  var sels;
  if (sel.isPropertySelection()) {
    sels = []; // we just do nothing in the property selection case? why?
  } else if (sel.isContainerSelection()) {
    sels = sel.splitIntoPropertySelections();
  }

  for (var i = 0; i < sels.length; i++) {
    var anno = {
      id: uuid(annoType),
      type: annoType
    };
    extend(anno, annoData);
    anno.path = sels[i].getPath();
    anno.startOffset = sels[i].getStartOffset();
    anno.endOffset = sels[i].getEndOffset();
    tx.create(anno);
  }
}


module.exports = createAnnotation;

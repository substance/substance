"use strict";

var _ = require('../../basics/helpers');
var helpers = require('../document_helpers');

/**
 * For a given container selection create property selections of a given type
 *
 * @param tx a transaction document
 * @param args
 *         - selection (Property or Container selection)
 *         - annotationType (type of annotation e.g. 'strong')
 *         - annotationData (data that should stick to the new anno)
 */
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
      id: _.uuid(annoType),
      type: annoType
    };
    _.extend(anno, annoData);
    anno.path = sels[i].getPath();
    anno.startOffset = sels[i].getStartOffset();
    anno.endOffset = sels[i].getEndOffset();
    tx.create(anno);
  }
}


/**
 * For a given selection create a new annotation
 *
 * @param tx a transaction document
 * @param args
 *         - selection (Property or Container selection)
 *         - containerId (needed for container annotations)
 *         - annotationType (type of annotation e.g. 'strong')
 *         - annotationData (optional) data that should stick to the new anno)
 *         - splitContainerSelections (optional)
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
    id: _.uuid(annoType),
    type: annoType,
  };
  _.extend(anno, annoData);

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

module.exports = createAnnotation;

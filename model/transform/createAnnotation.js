"use strict";

import extend from 'lodash/extend'
import uuid from '../../util/uuid'
import helpers from '../documentHelpers'

/**
  For a given container selection create property selections of a given type

  @param {model/TransactionDocument} tx the document instance
  @param {model/Selection} args.selection A document selection
  @param {String} args.containerId a valid container id
  @param {Object} args.node data describing the annotation node

  @example

  ```js
  createAnnotation(tx, {
    selection: bodyEditor.getSelection(),
    node: {
      type: 'link',
      url: 'http://example.com'
    }
  });
  ```
*/

function createAnnotation(tx, args) {
  var sel = args.selection;
  if (!sel) throw new Error('selection is required.');
  var annoType = args.annotationType;
  var annoData = args.annotationData;
  var anno = args.node;
  if (!anno && annoType) {
    console.warn('DEPRECATED: Use node: {type: "strong"} instead of annotationType: "strong"');
    anno = { type: annoType };
    extend(anno, annoData);
  }
  if (!anno) throw new Error('node is required');

  if (!sel.isPropertySelection() && !sel.isContainerSelection() || sel.isCollapsed()) {
    // the selection must be expanded and of type Property- or ContainerSelection
    throw new Error("Invalid selection for createAnnotation");
  }
  // Special case: We split the current container selection into
  // multiple property annotations
  if (sel.isContainerSelection() && args.splitContainerSelections) {
    return _createPropertyAnnotations(tx, args);
  }
  if (helpers.isContainerAnnotation(tx, anno.type)) {
    anno.startPath = sel.startPath;
    anno.endPath = sel.endPath;
    anno.containerId = sel.containerId;
  } else if (sel.isPropertySelection()) {
    anno.path = sel.path;
  } else {
    throw new Error('Illegal state: can not apply ContainerSelection');
  }
  anno.startOffset = sel.startOffset;
  anno.endOffset = sel.endOffset;
  args.result = tx.create(anno);
  return args;
}

function _createPropertyAnnotations(tx, args) {
  var sel = args.selection;
  var node = args.node;
  var sels;
  if (sel.isPropertySelection()) {
    sels = []; // we just do nothing in the property selection case? why?
  } else if (sel.isContainerSelection()) {
    sels = sel.splitIntoPropertySelections();
  }

  for (var i = 0; i < sels.length; i++) {
    var anno = {
      id: uuid(node.type)
    };
    extend(anno, node);
    anno.path = sels[i].getPath();
    anno.startOffset = sels[i].startOffset;
    anno.endOffset = sels[i].endOffset;
    tx.create(anno);
  }
}

export default createAnnotation;

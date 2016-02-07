"use strict";
/* jshint latedef: false */

var extend = require('lodash/extend');
var uuid = require('../../util/uuid');
var helpers = require('../documentHelpers');

/**
  For a given container selection create property selections of a given type

  @function

  @param {model/TransactionDocument} tx the document instance
  @param {Object} args object with transformation arguments `selection`, `containerId`, `annotationType` and `annotationData`
  @scopedparam {model/Selection} args.selection A document selection
  @scopedparam {String} args.containerId a valid container id
  @scopedparam {Object} args.node data describing the annotation node

  @example

  ```js
  createAnnotation(tx, {
    selection: bodyEditor.getSelection(),
    containerId: bodyEditor.getContainerId(),

    node: {
      type: 'link',
      url: 'http://example.com'
    }
  });
  ```
*/

function createAnnotation(tx, args) {
  var sel = args.selection;
  var annoType = args.annotationType;
  var annoData = args.annotationData;
  var node = args.node;
  var containerId = args.containerId;

  if (!node && annoType) {
    console.warn('DEPRECATED: Use node: {type: "strong"} instead of annotationType: "strong"');
    node = {
      type: annoType
    };
    extend(node, annoData);
  }

  if (!sel) {
    throw new Error('selection is required.');
  }
  if (!node) {
    throw new Error('node is required');
  }
  if (sel.isContainerSelection() && !containerId) {
    throw new Error('containerId must be provided for container selections');
  }
  // Special case: We split the current container selection into
  // multiple property annotations
  if (args.splitContainerSelections && sel.isContainerSelection()) {
    return _createPropertyAnnotations(tx, args);
  }
  var anno = extend({
    id: uuid(node.type)
  }, node);

  if (helpers.isContainerAnnotation(tx, node.type)) {
    anno.startPath = sel.startPath;
    anno.endPath = sel.endPath;
    anno.container = containerId;
  } else if (sel.isPropertySelection()) {
    anno.path = sel.path;
  } else {
    throw new Error('Illegal state: can not apply ContainerSelection');
  }
  anno.startOffset = sel.startOffset;
  anno.endOffset = sel.endOffset;
  // start the transaction with an initial selection
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

module.exports = createAnnotation;

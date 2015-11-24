'use strict';

var last = require('lodash/array/last');
var each = require('lodash/collection/each');
var uuid = require('../../util/uuid');
var annotationHelpers = require('../annotationHelpers');
var deleteSelection = require('./deleteSelection');
var insertText = require('./insertText');
var breakNode = require('./breakNode');
var CLIPBOARD_CONTAINER_ID = require('./copySelection').CLIPBOARD_CONTAINER_ID;

/* jshint latedef: false */

/**
  Pastes clipboard content at the current selection

  @param {Object} args object with `selection` and `doc` for Substance content or
  `text` for external HTML content
  @return {Object} with updated `selection`
*/

var paste = function(tx, args) {
  if (args.selection.isNull()) {
    console.error("Can not paste, without selection.");
    return args;
  }
  // TODO: is there a better way to detect that this paste is happening within a
  // container?
  var inContainer = !!args.containerId;
  var pasteDoc = args.doc;

  // when we are in a container, we interpret line-breaks
  // and create a document with multiple paragraphs
  // in a PropertyEditor we paste the text as is
  if (args.text && !pasteDoc) {
    if (inContainer) {
      pasteDoc = _convertPlainTextToDocument(tx, args);
    } else {
      return insertText(tx, args);
    }
  }
  if (!args.selection.isCollapsed()) {
    var tmp = deleteSelection(tx, args);
    args.selection = tmp.selection;
  }
  var nodes = pasteDoc.get(CLIPBOARD_CONTAINER_ID).nodes;
  if (nodes.length > 0) {
    var first = pasteDoc.get(nodes[0]);
    // copy of a property selection creates a doc containing
    // one default text node with id 'text'
    if (nodes.length === 1 && first.isInstanceOf("text")) {
      return _pasteAnnotatedText(tx, args);
    } else {
      return _pasteDocument(tx, args);
    }
  }
  return args;
};

function _convertPlainTextToDocument(tx, args) {
  var defaultTextType = tx.getSchema().getDefaultTextType();

  var paraText = args.text.split(/\s*\n\s*\n/);
  var pasteDoc = tx.newInstance();
  var container = pasteDoc.create({
    type: 'container',
    id: CLIPBOARD_CONTAINER_ID,
    nodes: []
  });
  for (var i = 0; i < paraText.length; i++) {
    var paragraph = pasteDoc.create({
      id: uuid(defaultTextType),
      type: defaultTextType,
      content: paraText[i]
    });
    container.show(paragraph.id);
  }
  return pasteDoc;
}

function _pasteAnnotatedText(tx, args) {
  var copy = args.doc;
  var selection = args.selection;

  var nodes = copy.get(CLIPBOARD_CONTAINER_ID).nodes;
  var textPath = [nodes[0], 'content'];
  var text = copy.get(textPath);
  var annotations = copy.getIndex('annotations').get(textPath);
  // insert plain text
  var path = selection.start.path;
  var offset = selection.start.offset;
  tx.update(path, { insert: { offset: offset, value: text } } );
  annotationHelpers.insertedText(tx, selection.start, text.length);
  selection = tx.createSelection({
    type: 'property',
    path: selection.start.path,
    startOffset: selection.start.offset+text.length
  });
  // copy annotations
  each(annotations, function(anno) {
    var data = anno.toJSON();
    data.path = path.slice(0);
    data.startOffset += offset;
    data.endOffset += offset;
    if (tx.get(data.id)) {
      data.id = uuid(data.type);
    }
    tx.create(data);
  });
  args.selection = selection;
  return args;
}

function _pasteDocument(tx, args) {
  var pasteDoc = args.doc;
  var containerId = args.containerId;
  var selection = args.selection;
  var container = tx.get(containerId);

  var startPath = selection.start.path;
  var startAddress = container.getAddress(startPath);
  var nextAddress = container.getNextAddress(startAddress);
  var insertPos;
  // Break, unless we are at the last character of a node,
  // then we can simply insert after the node
  if ( (!nextAddress || nextAddress[0] !== startAddress[0]) &&
    tx.get(startPath).length === selection.start.offset )
  {
    insertPos = startAddress[0] + 1;
  } else {
    var result = breakNode(tx, args);
    selection = result.selection;
    insertPos = startAddress[0];
  }
  if (insertPos < 0) {
    console.error('Could not find insertion position in ContainerNode.');
  }
  // transfer nodes from content document
  // TODO: transfer annotations
  var nodeIds = pasteDoc.get(CLIPBOARD_CONTAINER_ID).nodes;
  var annoIndex = pasteDoc.getIndex('annotations');
  var insertedNodes = [];
  for (var i = 0; i < nodeIds.length; i++) {
    var nodeId = nodeIds[i];
    var node = pasteDoc.get(nodeId).toJSON();
    // create a new id if the node exists already
    if (tx.get(nodeId)) {
      node.id = uuid(node.type);
    }
    node = tx.create(node);
    container.show(node.id, insertPos++);
    insertedNodes.push(node);

    // transfer annotations
    // what about nodes that are referenced by annotations?
    var annos = annoIndex.get(nodeId);
    for (var j = 0; j < annos.length; j++) {
      var data = annos[j].toJSON();
      if (node.id !== nodeId) {
        data.path[0] = node.id;
      }
      if (tx.get(data.id)) {
        data.id = uuid(data.type);
      }
      tx.create(data);
    }
  }

  if (insertedNodes.length === 0) return args;

  // set a new selection
  var lastPath = container.getLastPath(last(insertedNodes));
  var lastLength = tx.get(lastPath).length;
  // This version turned out to be useful in some situations
  // as it hightlights the pasted content
  // we leave it here for debugging
  if (false) {
    var firstPath = container.getFirstPath(insertedNodes[0]);
    selection = tx.createSelection({
      type: 'container',
      containerId: container.id,
      startPath: firstPath,
      startOffset: 0,
      endPath: lastPath,
      endOffset: lastLength
    });
  } else {
    selection = tx.createSelection({
      type: 'property',
      path: lastPath,
      startOffset: lastLength
    });
  }
  args.selection = selection;
  return args;
}

module.exports = paste;

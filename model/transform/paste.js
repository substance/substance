'use strict';

var last = require('lodash/array/last');
var each = require('lodash/collection/each');
var uuid = require('../../util/uuid');
var annotationHelpers = require('../annotationHelpers');
var deleteSelection = require('./deleteSelection');
var insertText = require('./insertText');
var breakNode = require('./breakNode');

var CLIPBOARD_CONTAINER_ID = require('./copySelection').CLIPBOARD_CONTAINER_ID;
var CLIPBOARD_PROPERTY_ID = require('./copySelection').CLIPBOARD_PROPERTY_ID;

/* jshint latedef: false */

/**
  Pastes clipboard content at the current selection

  @param {Object} args object with `selection` and `doc` for Substance content or
  `text` for external HTML content
  @return {Object} with updated `selection`
*/

var paste = function(tx, args) {
  args.text = args.text || '';
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
  if (!pasteDoc) {
    if (inContainer) {
      args.doc = pasteDoc = _convertPlainTextToDocument(tx, args);
    } else {
      return insertText(tx, args);
    }
  }
  if (!args.selection.isCollapsed()) {
    var tmp = deleteSelection(tx, args);
    args.selection = tmp.selection;
  }
  var nodes = pasteDoc.get(CLIPBOARD_CONTAINER_ID).nodes;
  var schema = tx.getSchema();

  if (nodes.length > 0) {
    var first = pasteDoc.get(nodes[0]);

    if (schema.isInstanceOf(first.type, 'text')) {
      args = _pasteAnnotatedText(tx, args);
      nodes.shift();
    }
    // if still nodes left > 0
    if (nodes.length > 0) {
      args = _pasteDocument(tx, args);
    }
  }
  return args;
};

/*
  Splits plain text by lines and puts them into paragraphs.
*/
function _convertPlainTextToDocument(tx, args) {
  var defaultTextType = tx.getSchema().getDefaultTextType();
  var lines = args.text.split(/\s*\n\s*\n/);
  var pasteDoc = tx.newInstance();
  var container = pasteDoc.create({
    type: 'container',
    id: CLIPBOARD_CONTAINER_ID,
    nodes: []
  });
  var node;
  if (lines.length === 1) {
    node = pasteDoc.create({
      id: CLIPBOARD_PROPERTY_ID,
      type: defaultTextType,
      content: lines[0]
    });
    container.show(node.id);
  } else {
    for (var i = 0; i < lines.length; i++) {
      node = pasteDoc.create({
        id: uuid(defaultTextType),
        type: defaultTextType,
        content: lines[i]
      });
      container.show(node.id);
    }
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
    insertPos = startAddress[0] + 1;
  }
  // TODO how should this check be useful?
  if (insertPos < 0) {
    console.error('Could not find insertion position in ContainerNode.');
  }
  // transfer nodes from content document
  var nodeIds = pasteDoc.get(CLIPBOARD_CONTAINER_ID).nodes;
  var annoIndex = pasteDoc.getIndex('annotations');
  var insertedNodes = [];
  for (var i = 0; i < nodeIds.length; i++) {
    var nodeId = nodeIds[i];
    var node = _copyNode(tx, pasteDoc.get(nodeId));
    container.show(node.id, insertPos++);
    insertedNodes.push(node);

    // transfer annotations
    // what if we have changed the id of nodes that are referenced by annotations?
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
  selection = tx.createSelection({
    type: 'property',
    path: lastPath,
    startOffset: lastLength
  });
  args.selection = selection;
  return args;
}

function _copyNode(tx, pasteNode) {
  var nodeId = pasteNode.id;
  var data = pasteNode.toJSON();
  // create a new id if the node exists already
  if (tx.get(nodeId)) {
    data.id = uuid(pasteNode.type);
  }
  if (pasteNode.hasChildren()) {
    var children = pasteNode.getChildren();
    var childrenIds = data[pasteNode.getChildrenProperty()];
    for (var i = 0; i < children.length; i++) {
      var childNode = _copyNode(tx, children[i]);
      childrenIds[i] = childNode.id;
    }
  }
  return tx.create(data);
}

module.exports = paste;

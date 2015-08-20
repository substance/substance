var _ = require('../../basics/helpers');
var Annotations = require('../annotation_updates');
var deleteSelection = require('./delete_selection');
var insertText = require('./insert_text');
var breakNode = require('./break_node');
var CLIPBOARD_CONTAINER_ID = require('./copy_selection').CLIPBOARD_CONTAINER_ID;

/* jshint latedef: false */

var paste = function(tx, args) {
  if (args.selection.isNull()) {
    console.error("Can not paste, without selection.");
    return args;
  }
  // if paste dataplain text paste is simple
  if (args.text && !args.doc) {
    return insertText(tx, args);
  }
  var pasteDoc = args.doc;
  if (!args.selection.isCollapsed()) {
    var out = deleteSelection(tx, args);
    args.selection = out.selection;
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

var _pasteAnnotatedText = function(tx, args) {
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
  Annotations.insertedText(tx, selection.start, text.length);
  selection = tx.createSelection({
    type: 'property',
    path: selection.start.path,
    startOffset: selection.start.offset+text.length
  });
  // copy annotations
  _.each(annotations, function(anno) {
    var data = anno.toJSON();
    data.path = path.slice(0);
    data.startOffset += offset;
    data.endOffset += offset;
    if (tx.get(data.id)) {
      data.id = _.uuid(data.type);
    }
    tx.create(data);
  });
  return {
    selection: selection
  };
};

var _pasteDocument = function(tx, args) {
  var pasteDoc = args.doc;
  var containerId = args.containerId;
  var selection = args.selection;
  var container = tx.get(containerId);

  // Break, unless we are at the last character of a node,
  // then we can simply insert after the node
  var startComp = container.getComponent(selection.start.path);
  var startNodeComp = startComp.parentNode;
  var insertPos;
  if ( startComp === _.last(startNodeComp.components) &&
    tx.get(startComp.path).length === selection.start.offset )
  {
    insertPos = container.getPosition(selection.start.path[0]) + 1;
  } else {
    var result = breakNode(tx, args);
    selection = result.selection;
    insertPos = container.getPosition(selection.start.path[0]);
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
      node.id = _.uuid(node.type);
    }
    tx.create(node);
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
        data.id = _.uuid(data.type);
      }
      tx.create(data);
    }
  }

  if (insertedNodes.length === 0) return;

  // set a new selection
  var lastId = _.last(insertedNodes).id;
  var lastComp = _.last(container.getComponentsForNode(lastId));
  var lastLength = tx.get(lastComp.path).length;
  // This version turned out to be useful in some situations
  // as it hightlights the pasted content
  // we leave it here for debugging
  if (false) {
    var firstId = insertedNodes[0].id;
    var firstComp = container.getComponentsForNode(firstId)[0];
    selection = tx.createSelection({
      type: 'container',
      containerId: container.id,
      startPath: firstComp.path,
      startOffset: 0,
      endPath: lastComp.path,
      endOffset: lastLength
    });
  } else {
    selection = tx.createSelection({
      type: 'property',
      path: lastComp.path,
      startOffset: lastLength
    });
  }
  return {
    selection: selection
  };
};

module.exports = paste;

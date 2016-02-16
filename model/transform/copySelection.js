/* jshint latedef: nofunc */

'use strict';

var cloneDeep = require('lodash/lang/cloneDeep');
var each = require('lodash/collection/each');
var annotationHelpers = require('../annotationHelpers');

var CLIPBOARD_CONTAINER_ID = "clipboard_content";
var CLIPBOARD_PROPERTY_ID = "clipboard_property";

/**
  Creates a new document instance containing only the selected content

  @param {Object} args object with `selection`
  @return {Object} with a `doc` property that has a fresh doc with the copied content
*/

function copySelection(tx, args) {
  var selection = args.selection;
  if (selection.isNull()) {
    args.doc = null;
  }
  // return a simplified version if only a piece of text is selected
  else if (selection.isPropertySelection()) {
    args.doc = _copyPropertySelection(tx, selection);
  }
  else if (selection.isContainerSelection()) {
    args.doc = _copyContainerSelection(tx, selection);
  }
  else if (selection.isNodeSelection()) {
    args.doc = _copyNodeSelection(tx, args);
  }
  else {
    console.error('Copy is not yet supported for selection type.');
    args.doc = null;
  }
  return args;
}

function _copyPropertySelection(doc, selection) {
  var copy = doc.newInstance();
  var path = selection.start.path;
  var offset = selection.start.offset;
  var endOffset = selection.end.offset;
  var text = doc.get(path);
  var containerNode = copy.get(CLIPBOARD_CONTAINER_ID);
  if (!containerNode) {
    containerNode = copy.create({
      type: 'container',
      id: CLIPBOARD_CONTAINER_ID,
      nodes: []
    });
  }
  copy.create({
    type: doc.schema.getDefaultTextType(),
    id: CLIPBOARD_PROPERTY_ID,
    content: text.substring(offset, endOffset)
  });
  containerNode.show(CLIPBOARD_PROPERTY_ID);
  var annotations = doc.getIndex('annotations').get(path, offset, endOffset);
  each(annotations, function(anno) {
    var data = cloneDeep(anno.toJSON());
    data.path = [CLIPBOARD_PROPERTY_ID, 'content'];
    data.startOffset = Math.max(offset, anno.startOffset)-offset;
    data.endOffset = Math.min(endOffset, anno.endOffset)-offset;
    copy.create(data);
  });
  return copy;
}

// TODO: copying nested nodes is not straight-forward,
// as it is not clear if the node is valid to be created just partially
// Basically this needs to be implemented for each nested node.
// The default implementation ignores partially selected nested nodes.
function _copyContainerSelection(doc, selection) {
  var copy = doc.newInstance();
  var annotationIndex = doc.getIndex('annotations');
  var container = doc.get(selection.containerId);
  // create a new container
  var containerNode = copy.create({
    type: 'container',
    id: CLIPBOARD_CONTAINER_ID,
    nodes: []
  });
  // copy nodes and annotations.
  var i, node;
  var created = {};
  var startAddress = container.getAddress(selection.start.path);
  var endAddress = container.getAddress(selection.end.path);
  for (i = startAddress[0]; i <= endAddress[0]; i++) {
    node = container.getChildAt(i);
    var nodeId = node.id;
    // skip created nodes
    if (!created[nodeId]) {
      created[nodeId] = copy.create(node.toJSON());
      containerNode.show(nodeId);
    }
    // nested nodes should provide a custom implementation
    if (node.hasChildren()) {
      // TODO: call a customized implementation for nested nodes
      // and continue, to skip the default implementation
    }
    var paths = container.getPathsForNode(node);
    for (var j = 0; j < paths.length; j++) {
      var annotations = annotationIndex.get(paths[j]);
      for (var k = 0; k < annotations.length; k++) {
        copy.create(cloneDeep(annotations[k].toJSON()));
      }
    }
  }
  // 2. Truncate properties according to the selection.
  // TODO: we need a more sophisticated concept when we introduce dynamic structures
  // such as lists or tables
  var text, path;
  node = container.getChildAt(startAddress[0]);
  var addresses = container.getAddressesForNode(node);
  for (i = 0; i < addresses.length; i++) {
    if (addresses[i].isBefore(startAddress)) {
      path = container.getPathForAddress(addresses[i]);
      copy.set(path, "");
    } else {
      if (selection.start.offset > 0) {
        path = container.getPathForAddress(addresses[i]);
        text = doc.get(path);
        copy.update(path, {
          delete: { start: 0, end: selection.start.offset }
        });
        annotationHelpers.deletedText(copy, path, 0, selection.start.offset);
      }
      break;
    }
  }

  node = container.getChildAt(endAddress[0]);
  addresses = container.getAddressesForNode(node);
  for (i = addresses.length - 1; i >= 0; i--) {
    path = container.getPathForAddress(addresses[i]);
    if (addresses[i].isAfter(endAddress)) {
      copy.set(path, "");
    } else {
      text = doc.get(path);
      if (selection.end.offset < text.length) {
        copy.update(path, {
          delete: { start: selection.end.offset, end: text.length }
        });
        annotationHelpers.deletedText(copy, path, selection.end.offset, text.length);
      }
      break;
    }
  }
  return copy;
}

function _copyNodeSelection(tx, args) {
  var copy = tx.newInstance();
  var sel = args.selection;
  var nodeId = sel.nodeId;
  // create a new container
  var container = copy.create({
    type: 'container',
    id: CLIPBOARD_CONTAINER_ID,
    nodes: []
  });
  var node = tx.get(nodeId);
  node = copy.create(node.toJSON());
  container.show(node.id);
  return copy;
}

copySelection.CLIPBOARD_CONTAINER_ID = CLIPBOARD_CONTAINER_ID;
copySelection.CLIPBOARD_PROPERTY_ID = CLIPBOARD_PROPERTY_ID;

module.exports = copySelection;

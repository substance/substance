'use strict';

var cloneDeep = require('lodash/cloneDeep');
var each = require('lodash/each');
var last = require('lodash/last');
var error = require('../../util/error');
var annotationHelpers = require('../annotationHelpers');

var CLIPBOARD_CONTAINER_ID = "clipboard_content";
var CLIPBOARD_PROPERTY_ID = "clipboard_property";

/**
  Creates a new document instance containing only the selected content

  @param {Object} args object with `selection`
  @return {Object} with a `doc` property that has a fresh doc with the copied content
*/

function copySelection(doc, args) {
  var selection = args.selection;
  if (selection.isNull()) {
    args.doc = null;
  }
  // return a simplified version if only a piece of text is selected
  else if (selection.isPropertySelection()) {
    args.doc = _copyPropertySelection(doc, selection);
  }
  else if (selection.isContainerSelection()) {
    args.doc = _copyContainerSelection(doc, selection);
  } else {
    error('Copy is not yet supported for selection type.');
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
  var container = doc.get(selection.containerId);
  // create a new container
  var containerNode = copy.create({
    type: 'container',
    id: CLIPBOARD_CONTAINER_ID,
    nodes: []
  });

  var fragments = selection.getFragments();

  if (fragments.length === 0) {
    return copy;
  }

  var created = {};

  // copy nodes and annotations.
  for (var i = 0; i < fragments.length; i++) {
    var fragment = fragments[i];
    var nodeId = fragment.getNodeId();
    var node = doc.get(nodeId);
    // skip created nodes
    if (!created[nodeId]) {
      _copyNode(copy, node, container, created);
      containerNode.show(nodeId);
    }
  }

  var firstFragment = fragments[0];
  var lastFragment = last(fragments);
  var path, offset, text;

  // if first is a text node, remove part before the selection
  if (firstFragment.isPropertyFragment()) {
    path = firstFragment.path;
    offset = firstFragment.startOffset;
    text = doc.get(path);
    copy.update(path, {
      delete: { start: 0, end: offset }
    });
    annotationHelpers.deletedText(copy, path, 0, offset);
  }

  // if last is a is a text node, remove part before the selection
  if (lastFragment.isPropertyFragment()) {
    path = lastFragment.path;
    offset = lastFragment.endOffset;
    text = doc.get(path);
    copy.update(path, {
      delete: { start: offset, end: text.length }
    });
    annotationHelpers.deletedText(copy, path, offset, text.length);
  }

  return copy;
}

function _copyNode(doc, node, container, created) {
  // nested nodes should provide a custom implementation
  if (node.hasChildren()) {
    // TODO: call a customized implementation for nested nodes
    // and continue, to skip the default implementation
    var children = node.getChildren();
    children.forEach(function(child) {
      _copyNode(doc, child, container, created);
    });
  }
  created[node.id] = doc.create(node.toJSON());

  var annotationIndex = doc.getIndex('annotations');
  var annotations = annotationIndex.get([node.id]);
  each(annotations, function(anno) {
    doc.create(cloneDeep(anno.toJSON()));
  });
}

copySelection.CLIPBOARD_CONTAINER_ID = CLIPBOARD_CONTAINER_ID;
copySelection.CLIPBOARD_PROPERTY_ID = CLIPBOARD_PROPERTY_ID;

module.exports = copySelection;

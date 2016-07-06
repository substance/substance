'use strict';

var cloneDeep = require('lodash/cloneDeep');
var each = require('lodash/each');
var last = require('lodash/last');
var Document = require('../Document');
var annotationHelpers = require('../annotationHelpers');

/**
  Creates a new document instance containing only the selected content

  @param {Object} args object with `selection`
  @return {Object} with a `doc` property that has a fresh doc with the copied content
*/

function copySelection(doc, args) {
  var selection = args.selection;
  if (!selection || !selection._isSelection) {
    throw new Error("'selection' is mandatory.");
  }
  if (selection.isNull() || selection.isCollapsed()) {
    args.doc = null;
  }

  // return a simplified version if only a piece of text is selected
  else if (selection.isPropertySelection()) {
    args.doc = _copyPropertySelection(doc, selection);
  }
  else if (selection.isContainerSelection()) {
    args.doc = _copyContainerSelection(doc, selection);
  }
  else if (selection.isNodeSelection()) {
    args.doc = _copyNodeSelection(doc, selection);
  }
  else {
    console.error('Copy is not yet supported for selection type.');
    args.doc = null;
  }
  return args;
}

function _copyPropertySelection(doc, selection) {
  var path = selection.start.path;
  var offset = selection.start.offset;
  var endOffset = selection.end.offset;
  var text = doc.get(path);
  var snippet = doc.createSnippet();
  var containerNode = snippet.getContainer();
  snippet.create({
    type: doc.schema.getDefaultTextType(),
    id: Document.TEXT_SNIPPET_ID,
    content: text.substring(offset, endOffset)
  });
  containerNode.show(Document.TEXT_SNIPPET_ID);
  var annotations = doc.getIndex('annotations').get(path, offset, endOffset);
  each(annotations, function(anno) {
    var data = cloneDeep(anno.toJSON());
    data.path = [Document.TEXT_SNIPPET_ID, 'content'];
    data.startOffset = Math.max(offset, anno.startOffset)-offset;
    data.endOffset = Math.min(endOffset, anno.endOffset)-offset;
    snippet.create(data);
  });
  return snippet;
}

// TODO: copying nested nodes is not straight-forward,
// as it is not clear if the node is valid to be created just partially
// Basically this needs to be implemented for each nested node.
// The default implementation ignores partially selected nested nodes.
function _copyContainerSelection(doc, selection) {
  var container = doc.get(selection.containerId);
  var snippet = doc.createSnippet();
  var containerNode = snippet.getContainer();

  var fragments = selection.getFragments();
  if (fragments.length === 0) return snippet;
  var created = {};
  // copy nodes and annotations.
  for (var i = 0; i < fragments.length; i++) {
    var fragment = fragments[i];
    var nodeId = fragment.getNodeId();
    var node = doc.get(nodeId);
    // skip created nodes
    if (!created[nodeId]) {
      _copyNode(snippet, node, container, created);
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
    snippet.update(path, {
      delete: { start: 0, end: offset }
    });
    annotationHelpers.deletedText(snippet, path, 0, offset);
  }

  // if last is a is a text node, remove part before the selection
  if (lastFragment.isPropertyFragment()) {
    path = lastFragment.path;
    offset = lastFragment.endOffset;
    text = doc.get(path);
    snippet.update(path, {
      delete: { start: offset, end: text.length }
    });
    annotationHelpers.deletedText(snippet, path, offset, text.length);
  }

  return snippet;
}

function _copyNodeSelection(doc, selection) {
  var container = doc.get(selection.containerId);
  var snippet = doc.createSnippet();
  var containerNode = snippet.getContainer();
  var nodeId = selection.getNodeId();
  var node = doc.get(nodeId);
  _copyNode(snippet, node, container, {});
  containerNode.show(node.id);
  return snippet;
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

module.exports = copySelection;

'use strict';

var _ = require('../../basics/helpers');
var Annotations = require('../annotation_updates');
var deleteNode = require('./delete_node');

// TODO: needs to be overhauled should work without a given container
// Working without a container does not really make really sense.
// Non-container editing situations are typically form-editors, where no notion
// of nodes exist actually, but only properties. Changing a node type is not necessary
// The only interesting thing is, to iterate over all containers
// so that a switched node gets replaced in all occurrences automatically.
// However, we don't have a use-case for it right now.

function switchTextType(tx, args) {
  var selection = args.selection;
  if (!selection.isPropertySelection()) {
    console.error("Selection must be a PropertySelection.");
    return args;
  }
  var nodeId = selection.getPath()[0];
  var data = args.data;
  var node = tx.get(nodeId);
  var path = selection.path;
  if (!(node.isInstanceOf('text'))) {
    console.warn('Trying to use switchTextType on a non text node. Skipping.');
    return args;
  }
  // create a new node and transfer annotations
  var newNode = _.extend({
    id: _.uuid(data.type),
    type: data.type,
    content: node.content
  }, data);
  var newPath = [newNode.id, 'content'];
  tx.create(newNode);
  Annotations.transferAnnotations(tx, path, 0, newPath, 0);

  // TODO: should work without a given container
  // _.each(tx.getContainers(), function(container) {
  //   pos = container.getPosition(nodeId);
  //   ....
  // });

  // hide the old one, show the new node
  var container = tx.get(args.containerId);
  var pos = container.getPosition(nodeId);
  if (pos >= 0) {
    container.hide(nodeId);
    container.show(newNode.id, pos);
  }

  // remove the old one from the document
  deleteNode(tx, { nodeId: node.id });

  args.selection = tx.createSelection({
    type: 'property',
    path: newPath,
    startOffset: selection.startOffset,
    endOffset: selection.endOffset
  });

  return args;
}

module.exports = switchTextType;

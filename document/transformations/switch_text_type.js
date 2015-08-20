'use strict';

var _ = require('../../basics/helpers');
var Annotations = require('../annotation_updates');
var deleteNode = require('./delete_node');

// TODO: needs to be overhauled
// should work without a given container

function switchTextType(tx, args) {
  var selection = args.selection;
  if (!selection.isPropertySelection()) {
    console.error("Selection must be a PropertySelection.");
    return;
  }
  
  var nodeId = selection.getPath()[0];
  var data = args.data;
  var node = tx.get(nodeId);
  var path = selection.path;

  if (!(node.isInstanceOf('text'))) {
    console.warn('Trying to use switchTextType on a non text node. Skipping.');
    return;
  }

  // create a new node
  var newNode = _.extend({
    id: _.uuid(data.type),
    type: data.type,
    content: node.content
  }, data);

  var newPath = [newNode.id, 'content'];
  var created = tx.create(newNode);

  Annotations.transferAnnotations(tx, path, 0, newPath, 0);
  
  // TODO: should work without a given container
  // _.each(tx.getContainers(), function(container) {
  //   pos = container.getPosition(nodeId);
  //   ....
  // });

  var container = tx.get(args.containerId);
  var pos = container.getPosition(nodeId);
  if (pos >= 0) {
    container.hide(nodeId);
    container.show(newNode.id, pos);
  }
  
  deleteNode(tx, { nodeId: node.id });

  return {
    selection: tx.createSelection({
      type: 'property',
      path: newPath,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset
    })
  };
}

module.exports = switchTextType;

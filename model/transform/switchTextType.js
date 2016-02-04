'use strict';

var extend = require('lodash/extend');
var uuid = require('../../util/uuid');
var annotationHelpers = require('../annotationHelpers');
var deleteNode = require('./deleteNode');

/**
  Switch text type for a given node. E.g. from `paragraph` to `heading`.

  @param {Object} args object with `selection`, `containerId` and `data` with new node data
  @return {Object} object with updated `selection`

  @example

  ```js
  switchTextType(tx, {
    selection: bodyEditor.getSelection(),
    containerId: bodyEditor.getContainerId(),
    data: {
      type: 'heading',
      level: 2
    }
  });
  ```
*/

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
  var newNode = extend({
    id: uuid(data.type),
    type: data.type,
    content: node.content
  }, data);
  var newPath = [newNode.id, 'content'];
  tx.create(newNode);
  annotationHelpers.transferAnnotations(tx, path, 0, newPath, 0);

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

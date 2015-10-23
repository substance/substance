'use strict';

var _ = require('../../util/helpers');

/**
 * Delete a node and all annotations attached to it,
 * and removes the node from all containers.
 *
 * @param args object with fields: `nodeId`.
 */
function deleteNode(tx, args) {
  if (!args.nodeId) {
    throw new Error('Parameter `nodeId` is mandatory.');
  }
  var nodeId = args.nodeId;
  // remove all associated annotations
  var annos = tx.getIndex('annotations').get(nodeId);
  var i;
  for (i = 0; i < annos.length; i++) {
    tx.delete(annos[i].id);
  }
  // We need to transfer anchors of ContainerAnnotations
  // to previous or next node:
  //  - start anchors go to the next node
  //  - end anchors go to the previous node
  var anchors = tx.getIndex('container-annotation-anchors').get(nodeId);
  for (i = 0; i < anchors.length; i++) {
    var anchor = anchors[i];
    var container = tx.get(anchor.container);
    // Note: during the course of this loop we might have deleted the node already
    // so, don't do it again
    if (!tx.get(anchor.id)) continue;

    var address = container.getAddress(anchor.path);
    var pos = address[0];

    if (anchor.isStart) {
      if (pos < container.length-1) {
        var nextNode = container.getChildAt(pos+1);
        var nextAddress = container.getFirstAddress(nextNode);
        tx.set([anchor.id, 'startPath'], container.getPath(nextAddress));
        tx.set([anchor.id, 'startOffset'], 0);
      } else {
        tx.delete(anchor.id);
      }
    } else {
      if (pos > 0) {
        var previousNode = container.getChildAt(pos-1);
        var previousAddress = container.getLastAddress(previousNode);
        var previousPath = container.getPath(previousAddress);
        var prevLength = tx.get(previousPath).length;
        tx.set([anchor.id, 'endPath'], previousPath);
        tx.set([anchor.id, 'endOffset'], prevLength);
      } else {
        tx.delete(anchor.id);
      }
    }
  }
  _.each(tx.getIndex('type').get('container'), function(container) {
    // remove from view first
    container.hide(nodeId);
  });
  // and then delete permanently
  tx.delete(nodeId);
  return args;
}

module.exports = deleteNode;

'use strict';

var each = require('lodash/each');

/*
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
  var node = tx.get(nodeId);
  // remove all associated annotations
  var annos = tx.getIndex('annotations').get(nodeId);
  var i;
  for (i = 0; i < annos.length; i++) {
    tx.delete(annos[i].id);
  }
  // transfer anchors of ContainerAnnotations to previous or next node:
  //  - start anchors go to the next node
  //  - end anchors go to the previous node
  var anchors = tx.getIndex('container-annotation-anchors').get(nodeId);
  for (i = 0; i < anchors.length; i++) {
    var anchor = anchors[i];
    var container = tx.get(anchor.containerId);
    // Note: during the course of this loop we might have deleted the node already
    // so, don't do it again
    if (!tx.get(anchor.id)) continue;
    var pos = container.getPosition(anchor.path[0]);
    var path, offset;
    if (anchor.isStart) {
      if (pos < container.getLength()-1) {
        var nextNode = container.getChildAt(pos+1);
        if (nextNode.isText()) {
          path = [nextNode.id, 'content'];
        } else {
          path = [nextNode.id];
        }
        tx.set([anchor.id, 'startPath'], path);
        tx.set([anchor.id, 'startOffset'], 0);
      } else {
        tx.delete(anchor.id);
      }
    } else {
      if (pos > 0) {
        var previousNode = container.getChildAt(pos-1);
        if (previousNode.isText()) {
          path = [previousNode.id, 'content'];
          offset = tx.get(path).length;
        } else {
          path = [previousNode.id];
          offset = 1;
        }
        tx.set([anchor.id, 'endPath'], path);
        tx.set([anchor.id, 'endOffset'], offset);
      } else {
        tx.delete(anchor.id);
      }
    }
  }
  // delete nested nodes
  if (node.hasChildren()) {
    node.getChildren().forEach(function(child) {
      deleteNode(tx, { nodeId: child.id });
    });
  }
  // hide node from all containers
  each(tx.getIndex('type').get('container'), function(container) {
    // remove from view first
    container.hide(nodeId);
  });
  // finally delete the node itself
  tx.delete(nodeId);
  return args;
}

module.exports = deleteNode;

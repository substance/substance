'use strict';

var _ = require('../../basics/helpers');

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
  // to previous or next node
  var anchors = tx.getIndex('container-annotation-anchors').get(nodeId);
  for (i = 0; i < anchors.length; i++) {
    var anchor = anchors[i];
    var container = tx.get(anchor.container);
    // Note: during the course of this loop we might have deleted the node already
    // so, do not do it again
    if (!tx.get(anchor.id)) continue;
    var comp = container.getComponent(anchor.path);
    if (anchor.isStart) {
      if (comp.hasNext()) {
        tx.set([anchor.id, 'startPath'], comp.next.path);
        tx.set([anchor.id, 'startOffset'], 0);
      } else {
        tx.delete(anchor.id);
      }
    } else {
      if (comp.hasPrevious()) {
        var prevLength = tx.get(comp.previous.path).length;
        tx.set([anchor.id, 'endPath'], comp.previous.path);
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

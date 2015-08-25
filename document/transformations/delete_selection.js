'use strict';

var _ = require('../../basics/helpers');
var deleteCharacter = require('./delete_character');
var deleteNode = require('./delete_node');
var merge = require('./merge');
var Annotations = require('../annotation_updates');

/* jshint latedef:false */

/**
 * Deletes a given selection.
 *
 * @param args object with `selection`
 * @return object with updated `selection`
 */
function deleteSelection(tx, args) {
  var selection = args.selection;
  if (selection.isCollapsed()) {
    args = deleteCharacter(tx, args);
  } else if (selection.isPropertySelection()) {
    args = _deletePropertySelection(tx, args);
  } else {
    // deal with container deletes
    args = _deleteContainerSelection(tx, args);
  }
  return args;
}

function _deletePropertySelection(tx, args) {
  var range = args.selection.getRange();
  var path = range.start.path;
  var startOffset = range.start.offset;
  var endOffset = range.end.offset;
  tx.update(path, { delete: { start: startOffset, end: endOffset } });
  Annotations.deletedText(tx, path, startOffset, endOffset);
  args.selection = tx.createSelection({
    type: 'property',
    path: path,
    startOffset: startOffset
  });
  return args;
}

function _deleteContainerSelection(tx, args) {
  var selection = args.selection;
  var containerId = selection.containerId;
  var range = selection.getRange();
  var nodeSels = _getNodeSelection(tx, selection);
  var nodeSel, node, type;

  args.selection = null;
  // apply deletion backwards so that we do not to recompute array positions
  var container = tx.get(containerId);
  var firstNodePos = container.getPosition(nodeSels[0].node.id);

  for (var idx = nodeSels.length - 1; idx >= 0; idx--) {
    nodeSel = nodeSels[idx];
    node = nodeSel.node;
    if (nodeSel.isFully) {
      deleteNode(tx, _.extend({}, args, {
        nodeId: node.id
      }));
    } else {
      _deleteNodePartially(tx, _.extend({}, args, {
        nodeSel: nodeSel
      }));
    }
  }
  // update the selection; take the first component which is not fully deleted
  if (!nodeSels[0].isFully) {
    args.selection = tx.createSelection({
      type: 'property',
      path: range.start.path,
      startOffset: range.start.offset
    });
  } else {
    // if the first node has been deleted fully we need to find the first property
    // which remained and set the selection to the first character.
    args.selection = null;
    for (var i = 1; i < nodeSels.length; i++) {
      nodeSel = nodeSels[i];
      if (!nodeSel.isFully) {
        args.selection = tx.createSelection({
          type: 'property',
          path: nodeSel.components[0].path,
          startOffset: 0
        });
        break;
      }
    }
    // TODO: if we could not find an insertion position,
    // that is the case when nodes were fully selected,
    // insert a default text node and set the cursor into it
    if (args.selection === null) {
      type = tx.getSchema().getDefaultTextType();
      node = {
        type: type,
        id: _.uuid(type),
        content: ""
      };
      tx.create(node);
      container.show(node.id, firstNodePos);
      args.selection = tx.createSelection({
        type: 'property',
        path: [node.id, 'content'],
        startOffset: 0
      });
    }
  }
  // Do a merge
  if (nodeSels.length>1) {
    var firstSel = nodeSels[0];
    var lastSel = nodeSels[nodeSels.length-1];
    if (firstSel.isFully || lastSel.isFully) {
      // TODO: think about if we want to merge in those cases
    } else {
      var secondComp = _.last(lastSel.components);
      var tmp = merge(tx, _.extend({}, args, {
        selection: args.selection,
        containerId: containerId,
        path: secondComp.path,
        direction: 'left'
      }));
      args.selection = tmp.selection;
    }
  }
  // If the container is empty after deletion insert a default text node is inserted
  container = tx.get(containerId);
  if (container.nodes.length === 0) {
    type = tx.getSchema().getDefaultTextType();
    node = {
      type: type,
      id: _.uuid(type),
      content: ""
    };
    tx.create(node);
    container.show(node.id, 0);
    args.selection = tx.createSelection({
      type: 'property',
      path: [node.id, 'content'],
      startOffset: 0
    });
  }
  return args;
}

function _deleteNodePartially(tx, args) {
  // Just go through all components and apply a property deletion
  var nodeSel = args.nodeSel;
  var components = nodeSel.components;
  var length = components.length;
  for (var i = 0; i < length; i++) {
    var comp = components[i];
    var startOffset = 0;
    var endOffset = tx.get(comp.path).length;
    if (i === 0) {
      startOffset = nodeSel.startOffset;
    }
    if (i === length-1) {
      endOffset = nodeSel.endOffset;
    }
    _deletePropertySelection(tx, _.extend({}, args, {
      selection: tx.createSelection({
        type: 'property',
        path: comp.path,
        startOffset: startOffset,
        endOffset: endOffset
      })
    }));
  }
}

// TODO: find a better naming and extract this into its own class
// it generates a data structure containing
// information about a selection range grouped by nodes
// e.g, if a node is fully selected or only partially
function _getNodeSelection(doc, containerSelection) {
  var result = [];
  var groups = {};
  var range = containerSelection.getRange();
  var container = doc.get(containerSelection.containerId);
  var components = container.getComponentsForRange(range);
  for (var i = 0; i < components.length; i++) {
    var comp = components[i];
    var node = doc.get(comp.rootId);
    if (!node) {
      throw new Error('Illegal state: expecting a component to have a proper root node id set.');
    }
    var nodeId = node.id;
    var nodeGroup;
    if (!groups[nodeId]) {
      nodeGroup = {
        node: node,
        isFully: true,
        components: []
      };
      groups[nodeId] = nodeGroup;
      result.push(nodeGroup);
    }
    nodeGroup = groups[nodeId];
    nodeGroup.components.push(comp);
  }
  // finally we analyze the first and last node-selection
  // if these
  var startComp = components[0];
  var endComp = components[components.length-1];
  var startNodeSel = result[0];
  var endNodeSel = result[result.length-1];
  var startLen = doc.get(startComp.path).length;
  var endLen = doc.get(endComp.path).length;
  if (range.start.offset > 0 ||
    (startComp.hasPrevious() && startComp.getPrevious().rootId === startComp.rootId))
  {
    startNodeSel.isFully = false;
    startNodeSel.startOffset = range.start.offset;
    if (result.length === 1) {
      startNodeSel.endOffset = range.end.offset;
    } else {
      startNodeSel.endOffset = startLen;
    }
  }
  if (result.length > 1 &&
      (range.end.offset < endLen ||
        (endComp.hasNext() && endComp.getNext().rootId === endComp.rootId))
     ) {
    endNodeSel.isFully = false;
    endNodeSel.startOffset = 0;
    endNodeSel.endOffset = range.end.offset;
  }
  return result;
}

module.exports = deleteSelection;

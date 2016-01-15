'use strict';

/* jshint latedef:false */

var extend = require('lodash/object/extend');
var last = require('lodash/array/last');
var uuid = require('../../util/uuid');
var deleteCharacter = require('./deleteCharacter');
var deleteNode = require('./deleteNode');
var merge = require('./merge');
var updateAnnotations = require('./updateAnnotations');

/**
  Deletes a given selection.

  @param {Object} args object with `selection`
  @return {Object} with updated `selection`

  @example
  
  ```js
  deleteSelection(tx, {
    selection: bodyEditor.getSelection(),
  });
  ```
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
  var op = tx.update(path, { delete: { start: startOffset, end: endOffset } });
  updateAnnotations(tx, {op: op});
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
      deleteNode(tx, extend({}, args, {
        nodeId: node.id
      }));
    } else {
      _deleteNodePartially(tx, extend({}, args, {
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
          path: nodeSel.paths[0],
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
        id: uuid(type),
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
      var secondPath = last(lastSel.paths);
      var tmp = merge(tx, extend({}, args, {
        selection: args.selection,
        containerId: containerId,
        path: secondPath,
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
      id: uuid(type),
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
  var paths = nodeSel.paths;
  var length = paths.length;
  for (var i = 0; i < length; i++) {
    var path = paths[i];
    var startOffset = 0;
    var endOffset = tx.get(path).length;
    if (i === 0) {
      startOffset = nodeSel.startOffset;
    }
    if (i === length-1) {
      endOffset = nodeSel.endOffset;
    }
    _deletePropertySelection(tx, extend({}, args, {
      selection: tx.createSelection({
        type: 'property',
        path: path,
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
  var addresses = container.getAddressRange(container.getAddress(range.start.path),
    container.getAddress(range.end.path));
  for (var i = 0; i < addresses.length; i++) {
    var address = addresses[i];
    var node = container.getChildAt(address[0]);
    if (!node) {
      throw new Error('Illegal state: expecting a component to have a proper root node id set.');
    }
    var nodeId = node.id;
    var nodeGroup;
    if (!groups[nodeId]) {
      nodeGroup = {
        node: node,
        isFully: true,
        addresses: [],
        paths: []
      };
      groups[nodeId] = nodeGroup;
      result.push(nodeGroup);
    }
    nodeGroup = groups[nodeId];
    nodeGroup.addresses.push(address);
    nodeGroup.paths.push(container.getPath(address));
  }
  // finally we analyze the first and last node-selection
  // if these
  var startAddress = addresses[0];
  var endAddress = addresses[addresses.length-1];
  var previousAddress = container.getPreviousAddress(startAddress);
  var nextAddress = container.getPreviousAddress(endAddress);
  var startNodeSel = result[0];
  var endNodeSel = result[result.length-1];
  var startLen = doc.get(container.getPath(startAddress)).length;
  var endLen = doc.get(container.getPath(endAddress)).length;
  if (range.start.offset > 0 ||
    (previousAddress && previousAddress[0] === startAddress[0]))
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
        (nextAddress && nextAddress[0] === endAddress[0]))
     ) {
    endNodeSel.isFully = false;
    endNodeSel.startOffset = 0;
    endNodeSel.endOffset = range.end.offset;
  }
  return result;
}

module.exports = deleteSelection;

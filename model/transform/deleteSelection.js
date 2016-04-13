'use strict';

/* jshint latedef:false */

var extend = require('lodash/extend');
var last = require('lodash/last');
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
    args = _deleteContainerSelection(tx, args);
  }
  return args;
}

function _deletePropertySelection(tx, args) {
  var sel = args.selection;
  var path = sel.path;
  var startOffset = sel.startOffset;
  var endOffset = sel.endOffset;
  var op = tx.update(path, { delete: { start: startOffset, end: endOffset } });
  updateAnnotations(tx, {op: op});
  args.selection = tx.createSelection(path, startOffset);
  return args;
}

function _deleteContainerSelection(tx, args) {
  var sel = args.selection;
  var containerId = sel.containerId;
  var container = tx.get(containerId);

  var startPos = container.getPosition(sel.start.path[0]);
  // var endPos = container.getPosition(sel.end.path[0]);
  var fragments = sel.getFragments();
  if (fragments.length === 0) {
    return args;
  }

  var remainingCoor = null;
  var node, type;

  for (var i = 0; i < fragments.length; i++) {
    var fragment = fragments[i];

    if (fragment.isPropertyFragment()) {
      if (fragment.isPartial()) {
        if (!remainingCoor) {
          remainingCoor = {
            path: fragment.path,
            offset: fragment.startOffset
          };
        }
        _deletePropertySelection(tx, {
          selection: fragment
        });
      } else {
        deleteNode(tx, extend({}, args, {
          nodeId: fragment.path[0]
        }));
      }
    } else if (fragment.isNodeFragment()) {
      deleteNode(tx, extend({}, args, {
        nodeId: fragment.nodeId
      }));
    }
  }

  // update the selection; take the first component which is not fully deleted
  if (remainingCoor) {
    args.selection = tx.createSelection(remainingCoor.path, remainingCoor.offset);
  } else {
    // if all nodes have been deleted insert a text node
    // TODO: in some cases this is not the desired behavior.
    // it is ok in cases such as:
    //  - when inserting text
    //  - pressing delete or backspace
    // this should not be done when
    //  - pasting a container (as opposed to property)
    //  - inserting a node
    // i.e. only before property operations
    type = tx.getSchema().getDefaultTextType();
    node = {
      type: type,
      id: uuid(type),
      content: ""
    };
    tx.create(node);
    container.show(node.id, startPos);
    args.selection = tx.createSelection([node.id, 'content'], 0);
  }

  // try to merge the first and last remaining nodes
  // NOTE: ATM only merges text nodes
  if (fragments.length > 1 &&
      fragments[0].isPartial() &&
      last(fragments).isPartial()) {
    merge(tx, extend({}, args, {
      selection: args.selection,
      containerId: containerId,
      path: sel.endPath,
      direction: 'left'
    }));
  }

  // If the container is empty insert an empty text node
  if (container.nodes.length === 0) {
    type = tx.getSchema().getDefaultTextType();
    node = {
      type: type,
      id: uuid(type),
      content: ""
    };
    tx.create(node);
    container.show(node.id, 0);
    args.selection = tx.createSelection([node.id, 'content'], 0);
  }

  return args;
}

module.exports = deleteSelection;

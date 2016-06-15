'use strict';

var extend = require('lodash/extend');
var merge = require('./merge');
var updateAnnotations = require('./updateAnnotations');
var deleteNode = require('./deleteNode');

/*
  The behavior when you press delete or backspace.
  I.e., it starts with a collapsed PropertySelection and deletes the character before
  or after the caret.
  If the caret is at the begin or end it will call `mergeNodes`.
*/
var deleteCharacter = function(tx, args) {
  var sel = args.selection;
  if (!sel) {
    throw new Error("'selection' is mandatory.");
  }
  if (!sel.isCollapsed()) {
    throw new Error('selection must be collapsed for transformation "deleteCharacter"');
  }
  if (sel.isPropertySelection()) {
    return _deleteCharacterInProperty(tx, args);
  } else if (sel.isNodeSelection()) {
    return _deleteCharacterWithNodeSelection(tx, args);
  }
  console.warn("'deleteChar' can not be used with the given selection", sel.toString());
  return args;
};

function _deleteCharacterInProperty(tx, args) {
  var sel = args.selection;
  if (!sel.isPropertySelection()) {
    throw new Error('Expecting a property selection.');
  }
  var direction = args.direction;
  var containerId = args.containerId;
  var startChar, endChar;
  var path = sel.path;
  var text = tx.get(path);
  if ((sel.startOffset === 0 && direction === 'left') ||
      (sel.startOffset === text.length && direction === 'right')) {
    // only try to merge if a containerId is given
    if (containerId) {
      var tmp = merge(tx, extend({}, args, {
        selection: sel,
        containerId: containerId,
        path: sel.path,
        direction: direction
      }));
      args.selection = tmp.selection;
    }
  } else {
    // simple delete one character
    startChar = (direction === 'left') ? sel.startOffset-1 : sel.startOffset;
    endChar = startChar+1;
    var op = tx.update(sel.path, { delete: { start: startChar, end: endChar } });
    updateAnnotations(tx, { op: op });
    args.selection = tx.createSelection(sel.path, startChar);
  }
  return args;
}

function _deleteCharacterWithNodeSelection(tx, args) {
  var sel = args.selection;
  if (!sel.isNodeSelection()) {
    throw new Error('Expecting a node selection.');
  }
  var direction = args.direction;
  var containerId = args.containerId;
  var nodeId = sel.getNodeId();
  var container = tx.get(containerId);
  var pos, text;
  if (sel.isFull() || ( sel.isBefore() && direction === 'right') ) {
    return deleteNode(tx, {
      nodeId: nodeId,
      containerId: containerId
    });
  } else if (sel.isBefore() && direction === 'left') {
    pos = container.getPosition(nodeId);
    if (pos > 0) {
      var previous = container.getNodeAt(pos-1);
      if (previous.isText()) {
        text = previous.getText();
        if (text.length === 0) {
          // don't return the selection returned by deleteNode
          deleteNode(tx, {
            nodeId: previous.id,
            containerId: containerId
          });
        } else {
          // just update the selection
          sel = tx.createSelection(previous.getTextPath(), text.length);
        }
      }
    }
  } else if (sel.isAfter() && direction === 'right') {
    pos = container.getPosition(nodeId);
    if (pos < container.getLength()-1) {
      var next = container.getNodeAt(pos+1);
      if (next.isText() && next.isEmpty()) {
        // don't return the selection returned by deleteNode
        deleteNode(tx, {
          nodeId: next.id,
          containerId: containerId
        });
      }
    }
  }
  return {
    selection: sel
  };
}

module.exports = deleteCharacter;

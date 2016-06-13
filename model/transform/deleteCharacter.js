'use strict';

var extend = require('lodash/extend');
var merge = require('./merge');
var updateAnnotations = require('./updateAnnotations');

/*
  The behavior when you press delete or backspace.
  I.e., it starts with a collapsed PropertySelection and deletes the character before
  or after the caret.
  If the caret is at the begin or end it will call `mergeNodes`.
*/
var deleteCharacter = function(tx, args) {
  var sel = args.selection;
  var direction = args.direction;
  var containerId = args.containerId;
  var startChar, endChar;
  if (!sel.isCollapsed()) {
    throw new Error('Selection must be collapsed for transformation "deleteCharacter"');
  }
  if (!sel.isPropertySelection()) {
    console.warn("'deleteChar' can only be used with collapsed PropertySelections");
    return args;
  }
  var prop = tx.get(sel.path);
  if ((sel.startOffset === 0 && direction === 'left') ||
      (sel.startOffset === prop.length && direction === 'right')) {
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
};

module.exports = deleteCharacter;

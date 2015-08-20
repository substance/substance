'use strict';

var Annotations = require('../annotation_updates');
var merge = require('./merge');

/**
 * The behavior when you press delete or backspace.
 * I.e., it starts with a collapsed PropertySelection and deletes the character before
 * or after the caret.
 * If the caret is at the begin or end it will call `mergeNodes`.
 */
var deleteCharacter = function(tx, args) {
  var selection = args.selection;
  var direction = args.direction;
  var range = selection.getRange();
  var startChar, endChar;
  if (!selection.isCollapsed()) {
    throw new Error('Selection must be collapsed for transformation "deleteCharacter"');
  }
  var prop = tx.get(range.start.path);
  if ((range.start.offset === 0 && direction === 'left') ||
      (range.start.offset === prop.length && direction === 'right')) {
    var result = merge(tx, {
      selection: selection,
      containerId: args.containerId,
      path: range.start.path,
      direction: direction
    });
    selection = result.selection;
  } else {
    // simple delete one character
    startChar = (direction === 'left') ? range.start.offset-1 : range.start.offset;
    endChar = startChar+1;
    tx.update(range.start.path, { delete: { start: startChar, end: endChar } });
    Annotations.deletedText(tx, range.start.path, startChar, endChar);
    selection = tx.createSelection({
      type: 'property',
      path: range.start.path,
      startOffset: startChar
    });
  }
  return { selection: selection };
};

module.exports = deleteCharacter;

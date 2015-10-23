'use strict';

var replaceText = require('./replace_text');
var updateAnnotations = require('./update_annotations');

var insertText = function(tx, args) {
  var selection = args.selection;
  var text = args.text;
  if (!selection) {
    throw new Error('Argument `selection` is mandatory for transformation `insertText`.');
  }
  if (!text) {
    throw new Error('Argument `text` is mandatory for transformation `insertText`.');
  }
  if (!(selection.isPropertySelection() || selection.isContainerSelection())) {
    throw new Error('Selection must be property or container selection.');
  }
  // Extra transformation for replacing text, as there are edge cases
  if (!selection.isCollapsed()) {
    return replaceText(tx, args);
  }
  var range = selection.getRange();
  // HACK(?): if the string property is not initialized yet we do it here
  // for convenience.
  if (tx.get(range.start.path) === undefined) {
    tx.set(range.start.path, "");
  }
  var op = tx.update(range.start.path, { insert: { offset: range.start.offset, value: text } } );
  updateAnnotations(tx, {op: op});
  args.selection = tx.createSelection({
    type: 'property',
    path: range.start.path,
    startOffset: range.start.offset + text.length
  });
  return args;
};

module.exports = insertText;

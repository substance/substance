'use strict';

var _ = require('../../basics/helpers');
var deleteSelection = require('./delete_selection');
var Annotations = require('../annotation_updates');

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
  var tmp;
  if (!selection.isCollapsed()) {
    tmp = deleteSelection(tx, _.extend({}, args, {
      selection: selection,
      direction: 'right'
    }));
    selection = tmp.selection;
  }
  var range = selection.getRange();
  // HACK(?): if the string property is not initialized yet we do it here
  // for convenience.
  if (tx.get(range.start.path) === undefined) {
    tx.set(range.start.path, "");
  }
  tx.update(range.start.path, { insert: { offset: range.start.offset, value: text } } );
  Annotations.insertedText(tx, range.start, text.length);

  args.selection = tx.createSelection({
    type: 'property',
    path: range.start.path,
    startOffset: range.start.offset + text.length
  });

  return args;
};

module.exports = insertText;

'use strict';

var _ = require('../../basics/helpers');
var deleteSelection = require('./delete_selection');
var Annotations = require('../annotation_updates');

/**
 * TODO: there is a use-case where this implementation does not suffice:
 * When the text of an annotation is selected fully, instead of deleting
 * the text and the annotation, the annotation should be preserved and adapted
 * to the range of the new text.
 */
var replaceText = function(tx, args) {
  var selection = args.selection;
  var text = args.text;
  var out = deleteSelection(tx, _.extend({}, args, {
    selection: selection,
    direction: 'right'
  }));
  selection = out.selection;
  var range = selection.getRange();
  tx.update(range.start.path, { insert: { offset: range.start.offset, value: text } } );
  Annotations.insertedText(tx, range.start, text.length);
  args.selection = tx.createSelection({
    type: 'property',
    path: range.start.path,
    startOffset: range.start.offset + text.length
  });
  return args;
};

module.exports = replaceText;

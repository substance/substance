'use strict';

var _ = require('../../basics/helpers');
var deleteSelection = require('./delete_selection');
var Annotations = require('../annotation_updates');

var _defaultReplace, _preservativeReplace;

/**
 * TODO: there is a use-case where this implementation does not suffice:
 * When the text of an annotation is selected fully, instead of deleting
 * the text and the annotation, the annotation should be preserved and adapted
 * to the range of the new text.
 */
var replaceText = function(tx, args) {
  var selection = args.selection;
  if (!selection.isPropertySelection()) {
    return _defaultReplace(tx, args);
  } else {
    return _preservativeReplace(tx, args);
  }
};

_defaultReplace = function(tx, args) {
  var out = deleteSelection(tx, _.extend({}, args, {
    direction: 'right'
  }));
  var selection = out.selection;
  var range = selection.getRange();
  var text = args.text;
  tx.update(range.start.path, { insert: { offset: range.start.offset, value: text } } );
  Annotations.insertedText(tx, range.start, text.length);
  args.selection = tx.createSelection({
    type: 'property',
    path: range.start.path,
    startOffset: range.start.offset + text.length
  });
  return args;
};

_preservativeReplace = function(tx, args) {
  var text = args.text;
  var range = args.selection.getRange();
  var path = range.start.path;
  var startOffset = range.start.offset;
  var endOffset = range.end.offset;
  // delete the text
  tx.update(path, { delete: { start: startOffset, end: endOffset } });
  // update annos but without deleting annos that cover the same range
  // as the selection
  var preservedAnnos = Annotations.deletedText(tx, path, startOffset, endOffset, 'replaceText');
  // insert text
  tx.update(range.start.path, { insert: { offset: range.start.offset, value: text } } );
  // update annos
  var newEndOffset = startOffset + text.length;
  Annotations.insertedText(tx, range.start, text.length, preservedAnnos);
  _.each(preservedAnnos, function(anno) {
    tx.set([anno.id, 'endOffset'], newEndOffset);
  });
  args.selection = tx.createSelection({
    type: 'property',
    path: path,
    startOffset: newEndOffset
  });
  return args;
};

module.exports = replaceText;

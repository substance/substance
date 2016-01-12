/* jshint latedef: false */
'use strict';

var extend = require('lodash/object/extend');
var deleteSelection = require('./deleteSelection');
var updateAnnotations = require('./updateAnnotations');

/*
 * TODO: there is a use-case where this implementation does not suffice:
 * When the text of an annotation is selected fully, instead of deleting
 * the text and the annotation, the annotation should be preserved and adapted
 * to the range of the new text.
 */
function replaceText(tx, args) {
  return _defaultReplace(tx, args);
}

function _defaultReplace(tx, args) {
  var out = deleteSelection(tx, extend({}, args, {
    direction: 'right'
  }));
  var selection = out.selection;
  var range = selection.getRange();
  var text = args.text;
  var op = tx.update(range.start.path, { insert: { offset: range.start.offset, value: text } } );
  updateAnnotations(tx, { op: op });
  args.selection = tx.createSelection({
    type: 'property',
    path: range.start.path,
    startOffset: range.start.offset + text.length
  });
  return args;
}

module.exports = replaceText;

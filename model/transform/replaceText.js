'use strict';

import extend from 'lodash/extend'
import deleteSelection from './deleteSelection'
import updateAnnotations from './updateAnnotations'

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
  var sel = out.selection;
  if (!sel.isPropertySelection()) {
    // Should not happen if deleteSelection works correctly
    throw new Error('Invalid state.');
  }
  var text = args.text;
  var op = tx.update(sel.path, { insert: { offset: sel.startOffset, value: text } } );
  updateAnnotations(tx, { op: op });
  args.selection = tx.createSelection(sel.path, sel.startOffset + text.length);
  return args;
}

export default replaceText;

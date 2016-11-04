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
  return _defaultReplace(tx, args)
}

function _defaultReplace(tx, args) {
  let out = deleteSelection(tx, extend({}, args, {
    direction: 'right'
  }))
  let sel = out.selection
  if (!sel.isPropertySelection()) {
    // Should not happen if deleteSelection works correctly
    throw new Error('Invalid state.')
  }
  let text = args.text
  let op = tx.update(sel.path, { type: 'insert', start: sel.startOffset, text: text })
  updateAnnotations(tx, { op: op })
  args.selection = tx.createSelection(sel.path, sel.startOffset + text.length)
  return args
}

export default replaceText

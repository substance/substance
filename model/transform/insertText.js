import replaceText from './replaceText'
import updateAnnotations from './updateAnnotations'

/**
  Inserts text at the given selection.

  @param {Object} args object with `selection`, `text`
  @return {Object} object with updated `selection`

  @example


  ```js
  insertText(tx, {
    selection: bodyEditor.getSelection(),
    text: 'Guten Tag'
  });
  ```
*/

let insertText = function(tx, args) {
  let sel = args.selection
  let text = args.text
  if (!sel) {
    throw new Error('Argument `selection` is mandatory for transformation `insertText`.')
  }
  if (!text) {
    throw new Error('Argument `text` is mandatory for transformation `insertText`.')
  }
  if (!(sel.isPropertySelection() || sel.isContainerSelection())) {
    console.error("Selection must be a Property- or ContainerSelection.")
    return args
  }
  // Extra transformation for replacing text, as there are edge cases
  if (!sel.isCollapsed()) {
    return replaceText(tx, args)
  }
  // HACK(?): if the string property is not initialized yet we do it here
  // for convenience.
  if (tx.get(sel.startPath) === undefined) {
    tx.set(sel.startPath, "")
  }
  let op = tx.update(sel.startPath, { type: 'insert', start: sel.startOffset, text: text })
  updateAnnotations(tx, {op: op})
  args.selection = tx.createSelection(sel.startPath, sel.startOffset + text.length)
  return args
};

export default insertText

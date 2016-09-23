'use strict';

/*
 @param {model/Document} tx
 @param {model/Annotation} args.anno annotation which should be expanded
 @param {model/Selection}  args.selection selection to which to expand
*/
function truncateAnnotation(tx, args) {
  let sel = args.selection
  let anno = args.anno
  if (!sel || !sel._isSelection) throw new Error('Argument "selection" is required.')
  if (!anno || !anno._isAnnotation) throw new Error('Argument "anno" is required.')

  let annoSel = anno.getSelection()
  let newAnnoSel = annoSel.truncateWith(sel)
  anno.updateRange(tx, newAnnoSel)
  args.result = anno
  return args
}

export default truncateAnnotation

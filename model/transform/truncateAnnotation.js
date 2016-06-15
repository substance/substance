'use strict';

/*
 @param {model/Document} tx
 @param {model/Annotation} args.anno annotation which should be expanded
 @param {model/Selection}  args.selection selection to which to expand
*/
function truncateAnnotation(tx, args) {
  var sel = args.selection;
  var anno = args.anno;
  if (!sel || !sel._isSelection) throw new Error('Argument "selection" is required.');
  if (!anno || !anno._isAnnotation) throw new Error('Argument "anno" is required.');

  var annoSel = anno.getSelection();
  var newAnnoSel = annoSel.truncateWith(sel);
  anno.updateRange(tx, newAnnoSel);
  args.result = anno;
  return args;
}

module.exports = truncateAnnotation;

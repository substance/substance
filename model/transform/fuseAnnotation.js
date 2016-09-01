'use strict';

import each from 'lodash/each'
import isArray from 'lodash/isArray'
import createAnnotation from './createAnnotation'

/*
 @param {model/Document} tx
 @param {model/Annotation[]} args.annos annotations which should be fused
*/
function fuseAnnotation(tx, args) {
  var annos = args.annos;
  if (!isArray(annos) || annos.length < 2) {
    throw new Error('fuseAnnotation(): at least two annotations are necessary.');
  }
  var sel, annoType;
  annos.forEach(function(anno, idx) {
    if (idx === 0) {
      sel = anno.getSelection();
      annoType = anno.type;
    } else {
      if (anno.type !== annoType) {
        throw new Error('fuseAnnotation(): all annotations must be of the same type.');
      }
      sel = sel.expand(anno.getSelection());
    }
  });
  each(annos, function(anno) {
    tx.delete(anno.id);
  });
  // The expanded selection
  args.selection = sel;
  args.node = {type: annoType};

  // Sets args.result to new annotation
  return createAnnotation(tx, args);
}

export default fuseAnnotation;

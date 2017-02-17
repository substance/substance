import isArray from '../util/isArray'
import uuid from '../util/uuid'


// A collection of methods to update annotations
// --------
//
// As we treat annotations as overlay of plain text we need to keep them up-to-date during editing.

export default {
  insertedText,
  deletedText,
  transferAnnotations,
  expandAnnotation,
  fuseAnnotation,
  truncateAnnotation
}

function insertedText(doc, coordinate, length) {
  if (!length) return;
  var index = doc.getIndex('annotations');
  var annotations = index.get(coordinate.path)
  for (let i = 0; i < annotations.length; i++) {
    let anno = annotations[i]
    var pos = coordinate.offset;
    var start = anno.start.offset;
    var end = anno.end.offset;
    var newStart = start;
    var newEnd = end;
    if ( (pos < start) ||
         (pos === start) ) {
      newStart += length;
    }
    // inline nodes do not expand automatically
    if ( (pos < end) ||
         (pos === end && !anno.isInline()) ) {
      newEnd += length;
    }
    // TODO: Use coordintate ops!
    if (newStart !== start) {
      doc.set([anno.id, 'start', 'offset'], newStart);
    }
    if (newEnd !== end) {
      doc.set([anno.id, 'end', 'offset'], newEnd);
    }
  }

  // TODO: fix support for container annotations
  // // same for container annotation anchors
  // index = doc.getIndex('container-annotation-anchors');
  // var anchors = index.get(coordinate.path);
  // forEach(anchors, function(anchor) {
  //   var pos = coordinate.offset;
  //   var start = anchor.offset;
  //   var changed = false;
  //   if ( (pos < start) ||
  //        (pos === start && !coordinate.after) ) {
  //     start += length;
  //     changed = true;
  //   }
  //   if (changed) {
  //     let coor = (anchor.isStart?'start':'end');
  //     // TODO: Use coordintate ops!
  //     doc.set([anchor.id, coor, 'offset'], start);
  //   }
  // });
}

function deletedText(doc, path, startOffset, endOffset) {
  if (startOffset === endOffset) return;
  var index = doc.getIndex('annotations');
  var annotations = index.get(path);
  var length = endOffset - startOffset;
  for (let i = 0; i < annotations.length; i++) {
    let anno = annotations[i]
    var pos1 = startOffset;
    var pos2 = endOffset;
    var start = anno.start.offset;
    var end = anno.end.offset;
    var newStart = start;
    var newEnd = end;
    if (pos2 <= start) {
      newStart -= length;
      newEnd -= length;
      doc.set([anno.id, 'start', 'offset'], newStart);
      doc.set([anno.id, 'end', 'offset'], newEnd);
    } else {
      if (pos1 <= start) {
        newStart = start - Math.min(pos2-pos1, start-pos1);
      }
      if (pos1 <= end) {
        newEnd = end - Math.min(pos2-pos1, end-pos1);
      }
      // delete the annotation if it has collapsed by this delete
      if (start !== end && newStart === newEnd) {
        doc.delete(anno.id);
      } else {
        // TODO: Use coordintate ops!
        if (start !== newStart) {
          doc.set([anno.id, 'start', 'offset'], newStart);
        }
        if (end !== newEnd) {
          doc.set([anno.id, 'end', 'offset'], newEnd);
        }
      }
    }
  }
  // TODO: fix support for container annotations
  // // same for container annotation anchors
  // index = doc.getIndex('container-annotation-anchors');
  // var anchors = index.get(path);
  // var containerAnnoIds = [];
  // forEach(anchors, function(anchor) {
  //   containerAnnoIds.push(anchor.id);
  //   var pos1 = startOffset;
  //   var pos2 = endOffset;
  //   var start = anchor.offset;
  //   var changed = false;
  //   if (pos2 <= start) {
  //     start -= length;
  //     changed = true;
  //   } else {
  //     if (pos1 <= start) {
  //       var newStart = start - Math.min(pos2-pos1, start-pos1);
  //       if (start !== newStart) {
  //         start = newStart;
  //         changed = true;
  //       }
  //     }
  //   }
  //   if (changed) {
  //     // TODO: Use coordintate ops!
  //     let coor = (anchor.isStart?'start':'end');
  //     doc.set([anchor.id, coor, 'offset'], start);
  //   }
  // });
  // // check all anchors after that if they have collapsed and remove the annotation in that case
  // forEach(uniq(containerAnnoIds), function(id) {
  //   var anno = doc.get(id);
  //   var annoSel = anno.getSelection();
  //   if(annoSel.isCollapsed()) {
  //     // console.log("...deleting container annotation because it has collapsed" + id);
  //     doc.delete(id);
  //   }
  // });
}

// used when breaking a node to transfer annotations to the new property
function transferAnnotations(doc, path, offset, newPath, newOffset) {
  var index = doc.getIndex('annotations');
  var annotations = index.get(path, offset);
  for (let i = 0; i < annotations.length; i++) {
    let a = annotations[i]
    var isInside = (offset > a.start.offset && offset < a.end.offset);
    var start = a.start.offset;
    var end = a.end.offset;
    // 1. if the cursor is inside an annotation it gets either split or truncated
    if (isInside) {
      // create a new annotation if the annotation is splittable
      if (a.canSplit()) {
        let newAnno = a.toJSON();
        newAnno.id = uuid(a.type + "_");
        newAnno.start.path = newPath
        newAnno.start.offset = newOffset
        newAnno.end.path = newPath
        newAnno.end.offset = newOffset + a.end.offset - offset
        doc.create(newAnno);
      }
      // in either cases truncate the first part
      let newStartOffset = a.start.offset;
      let newEndOffset = offset;
      // if after truncate the anno is empty, delete it
      if (newEndOffset === newStartOffset) {
        doc.delete(a.id);
      }
      // ... otherwise update the range
      else {
        // TODO: Use coordintate ops!
        if (newStartOffset !== start) {
          doc.set([a.id, 'start', 'offset'], newStartOffset);
        }
        if (newEndOffset !== end) {
          doc.set([a.id, 'end', 'offset'], newEndOffset);
        }
      }
    }
    // 2. if the cursor is before an annotation then simply transfer the annotation to the new node
    else if (a.start.offset >= offset) {
      // TODO: Use coordintate ops!
      // Note: we are preserving the annotation so that anything which is connected to the annotation
      // remains valid.
      doc.set([a.id, 'start', 'path'], newPath);
      doc.set([a.id, 'start', 'offset'], newOffset + a.start.offset - offset);
      doc.set([a.id, 'end', 'path'], newPath);
      doc.set([a.id, 'end', 'offset'], newOffset + a.end.offset - offset);
    }
  }

  // TODO: fix support for container annotations
  // // same for container annotation anchors
  // index = doc.getIndex('container-annotation-anchors');
  // var anchors = index.get(path);
  // var containerAnnoIds = [];
  // forEach(anchors, function(anchor) {
  //   containerAnnoIds.push(anchor.id);
  //   var start = anchor.offset;
  //   if (offset <= start) {
  //     // TODO: Use coordintate ops!
  //     let coor = anchor.isStart?'start':'end'
  //     doc.set([anchor.id, coor, 'path'], newPath);
  //     doc.set([anchor.id, coor, 'offset'], newOffset + anchor.offset - offset);
  //   }
  // });
  // // check all anchors after that if they have collapsed and remove the annotation in that case
  // forEach(uniq(containerAnnoIds), function(id) {
  //   var anno = doc.get(id);
  //   var annoSel = anno.getSelection();
  //   if(annoSel.isCollapsed()) {
  //     // console.log("...deleting container annotation because it has collapsed" + id);
  //     doc.delete(id);
  //   }
  // });
}

/*
 @param {model/Document} tx
 @param {model/PropertyAnnotation} args.anno annotation which should be expanded
 @param {model/Selection}  args.selection selection to which to expand
*/
function truncateAnnotation(tx, anno, sel) {
  if (!sel || !sel._isSelection) throw new Error('Argument "selection" is required.')
  if (!anno || !anno._isAnnotation) throw new Error('Argument "anno" is required.')
  let annoSel = anno.getSelection()
  let newAnnoSel = annoSel.truncateWith(sel)
  anno._updateRange(tx, newAnnoSel)
  return anno
}

/*
 @param {model/Document} tx
 @param {model/PropertyAnnotation} args.anno annotation which should be expanded
 @param {model/Selection}  args.selection selection to which to expand
*/
function expandAnnotation(tx, anno, sel) {
  if (!sel || !sel._isSelection) throw new Error('Argument "selection" is required.')
  if (!anno || !anno._isAnnotation) throw new Error('Argument "anno" is required.')
  let annoSel = anno.getSelection()
  let newAnnoSel = annoSel.expand(sel)
  anno._updateRange(tx, newAnnoSel)
  return anno
}

/*
 @param {model/Document} tx
 @param {model/PropertyAnnotation[]} args.annos annotations which should be fused
*/
function fuseAnnotation(tx, annos) {
  if (!isArray(annos) || annos.length < 2) {
    throw new Error('fuseAnnotation(): at least two annotations are necessary.')
  }
  let sel, annoType
  annos.forEach(function(anno, idx) {
    if (idx === 0) {
      sel = anno.getSelection()
      annoType = anno.type
    } else {
      if (anno.type !== annoType) {
        throw new Error('fuseAnnotation(): all annotations must be of the same type.')
      }
      sel = sel.expand(anno.getSelection())
    }
  })
  // expand the first and delete the others
  for (var i = 1; i < annos.length; i++) {
    tx.delete(annos[i].id)
  }
  expandAnnotation(tx, annos[0], sel)
  tx.setSelection(sel)
}

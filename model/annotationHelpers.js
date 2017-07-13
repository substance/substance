import isArray from '../util/isArray'
import uuid from '../util/uuid'


// A collection of methods to update annotations
// --------
//
// As we treat annotations as overlay of plain text we need to keep them up-to-date during editing.

export default {
  updateAnnotationsAfterInsert,
  updateAnnotationsAfterDelete,
  transferAnnotations,
  expandAnnotation,
  fuseAnnotation,
  truncateAnnotation
}

// helper for updating annotations after inserting text
export function updateAnnotationsAfterInsert(doc, path, startOffset, endOffset, text, typeover) {
  let L = text.length
  // update annotations
  let annos = doc.getAnnotations(path)
  for (let i = 0; i < annos.length; i++) {
    let anno = annos[i]
    let annoStart = anno.start.offset
    let annoEnd = anno.end.offset
    // I anno is before
    if (annoEnd<startOffset) {
      continue
    }
    // II anno is after
    else if (annoStart>=endOffset) {
      doc.update([anno.id, 'start'], { type: 'shift', value: startOffset-endOffset+L })
      doc.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset+L })
    }
    // III anno is deleted
    // NOTE: InlineNodes only have a length of one character
    // so they are always 'covered', and as they can not expand
    // they are deleted
    else if (
      (annoStart>=startOffset && annoEnd<endOffset) ||
      (anno._isInlineNode && annoStart>=startOffset && annoEnd<=endOffset)
    ) {
      doc.delete(anno.id)
    }
    // IV anno.start between and anno.end after
    else if (annoStart>=startOffset && annoEnd>=endOffset) {
      // do not move start if typing over
      if (annoStart>startOffset || !typeover) {
        doc.update([anno.id, 'start'], { type: 'shift', value: startOffset-annoStart+L })
      }
      doc.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset+L })
    }
    // V anno.start before and anno.end between
    else if (annoStart<startOffset && annoEnd<endOffset) {
      // NOTE: here the anno gets expanded (that's the common way)
      doc.update([anno.id, 'end'], { type: 'shift', value: startOffset-annoEnd+L })
    }
    // VI anno.start before and anno.end after
    else if (annoEnd === startOffset && !anno.constructor.autoExpandRight) {
      if (anno._isInlineNode) {
        // skip
      } else {
        doc.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset+L })
      }
    }
    else {
      console.warn('TODO: handle annotation update case.')
    }
  }
  // same for container annotation anchors
  let anchors = doc.getIndex('container-annotations').getAnchorsForPath(path)
  for (let i = 0; i < anchors.length; i++) {
    let anchor = anchors[i]
    let start = anchor.offset
    if (startOffset <= start) {
      start += L
      // HACK: In the ctor of Annotation we add _isStart and _isEnd, which are not regular Coordinate props otherwise
      let coor = (anchor._isStart ? 'start' : 'end')
      // TODO: Use coordintate ops!
      doc.set([anchor._annotationId, coor, 'offset'], start)
    }
  }
}

export function updateAnnotationsAfterDelete(doc, path, startOffset, endOffset) {
  if (startOffset === endOffset) return
  const annos = doc.getIndex('annotations').get(path)
  const L = endOffset - startOffset;
  for (let i = 0; i < annos.length; i++) {
    const anno = annos[i]
    let annoStart = anno.start.offset
    let annoEnd = anno.end.offset
    // I anno is before
    if (annoEnd<=startOffset) {
      continue
    }
    // II anno is after
    else if (annoStart>=endOffset) {
      doc.update([anno.id, 'start'], { type: 'shift', value: startOffset-endOffset })
      doc.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset })
    }
    // III anno is deleted
    else if (annoStart>=startOffset && annoEnd<=endOffset) {
      doc.delete(anno.id)
    }
    // IV anno.start between and anno.end after
    else if (annoStart>=startOffset && annoEnd>=endOffset) {
      if (annoStart>startOffset) {
        doc.update([anno.id, 'start'], { type: 'shift', value: startOffset-annoStart })
      }
      doc.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset })
    }
    // V anno.start before and anno.end between
    else if (annoStart<=startOffset && annoEnd<=endOffset) {
      doc.update([anno.id, 'end'], { type: 'shift', value: startOffset-annoEnd })
    }
    // VI anno.start before and anno.end after
    else if (annoStart<startOffset && annoEnd >= endOffset) {
      doc.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset })
    }
    else {
      console.warn('TODO: handle annotation update case.')
    }
  }
  // same for container annotation anchors
  let anchors = doc.getIndex('container-annotations').getAnchorsForPath(path)
  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i]
    const pos1 = startOffset
    const pos2 = endOffset
    const start = anchor.offset
    const coor = anchor._isStart ? 'start' : 'end'
    const anno = doc.get(anchor._annotationId)
    if (pos2 <= start) {
      doc.update([anno.id, coor], { type: 'shift', value: -L })
    } else if (pos1 <= start) {
      let newStart = start - Math.min(pos2-pos1, start-pos1)
      if (newStart !== start) {
        doc.update([anno.id, coor], { type: 'shift', value: newStart-start })
      }
    }
    // check if the annotation has collapsed due to the last change and remove it in that case
    if (anno.start.equals(anno.end)) {
      // console.log('deleting container annotation', anno.id)
      doc.delete(anno.id);
    }
  }
}

// used when breaking a node to transfer annotations to the new property
export function transferAnnotations(tx, path, offset, newPath, newOffset) {
  const doc = tx.getDocument()
  const annotations = doc.getIndex('annotations').get(path, offset);
  for (let i = 0; i < annotations.length; i++) {
    const a = annotations[i]
    const isInside = (offset > a.start.offset && offset < a.end.offset);
    const startOffset = a.start.offset;
    const endOffset = a.end.offset;
    // 1. if the cursor is inside an annotation it gets either split or truncated
    if (isInside) {
      // create a new annotation if the annotation is splittable
      if (a.canSplit()) {
        let newAnno = a.toJSON();
        newAnno.id = uuid(a.type + "_");
        newAnno.start.path = newPath
        newAnno.start.offset = newOffset
        newAnno.end.path = newPath
        newAnno.end.offset = newOffset + endOffset - offset
        tx.create(newAnno);
      }
      // in either cases truncate the first part
      let newStartOffset = startOffset
      let newEndOffset = offset
      // if after truncate the anno is empty, delete it
      if (newEndOffset === newStartOffset) {
        tx.delete(a.id);
      }
      // ... otherwise update the range
      else {
        // TODO: use coordintate ops
        if (newStartOffset !== startOffset) {
          tx.set([a.id, 'start', 'offset'], newStartOffset);
        }
        if (newEndOffset !== endOffset) {
          tx.set([a.id, 'end', 'offset'], newEndOffset);
        }
      }
    }
    // 2. if the cursor is before an annotation then simply transfer the annotation to the new node
    else if (startOffset >= offset) {
      // TODO: use coordintate ops
      tx.set([a.id, 'start', 'path'], newPath);
      tx.set([a.id, 'start', 'offset'], newOffset + startOffset - offset);
      tx.set([a.id, 'end', 'path'], newPath);
      tx.set([a.id, 'end', 'offset'], newOffset + endOffset - offset);
    }
  }

  // same for container annotation anchors
  let anchors = doc.getIndex('container-annotations').getAnchorsForPath(path)
  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i]
    const startOffset = anchor.offset
    let anno = tx.get(anchor._annotationId)
    if (offset <= startOffset) {
      let coor = anchor._isStart ? 'start' : 'end'
      // TODO: use coordintate ops
      tx.set([anno.id, coor, 'path'], newPath);
      tx.set([anno.id, coor, 'offset'], newOffset + startOffset - offset)
    }
    // check if the annotation has collapsed due to the last change and remove it in that case
    if (anno.start.equals(anno.end)) {
      tx.delete(anno.id)
    }
  }
}

/*
 @param {model/Document} tx
 @param {model/PropertyAnnotation} args.anno annotation which should be expanded
 @param {model/Selection}  args.selection selection to which to expand
*/
export function truncateAnnotation(tx, anno, sel) {
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
export function expandAnnotation(tx, anno, sel) {
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
export function fuseAnnotation(tx, annos) {
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

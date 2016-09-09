import forEach from 'lodash/forEach'
import uniq from 'lodash/uniq'
import uuid from '../util/uuid'

// TODO: this should be implemented as transformations

// A collection of methods to update annotations
// --------
//
// As we treat annotations as overlay of plain text we need to keep them up-to-date during editing.

function insertedText(doc, coordinate, length) {
  if (!length) return;
  var index = doc.getIndex('annotations');
  var annotations = index.get(coordinate.path);
  forEach(annotations, function(anno) {
    var pos = coordinate.offset;
    var start = anno.startOffset;
    var end = anno.endOffset;
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
    if (newStart !== start) {
      doc.set([anno.id, 'startOffset'], newStart);
    }
    if (newEnd !== end) {
      doc.set([anno.id, 'endOffset'], newEnd);
    }
  });
  // same for container annotation anchors
  index = doc.getIndex('container-annotation-anchors');
  var anchors = index.get(coordinate.path);
  forEach(anchors, function(anchor) {
    var pos = coordinate.offset;
    var start = anchor.offset;
    var changed = false;
    if ( (pos < start) ||
         (pos === start && !coordinate.after) ) {
      start += length;
      changed = true;
    }
    if (changed) {
      var property = (anchor.isStart?'startOffset':'endOffset');
      doc.set([anchor.id, property], start);
    }
  });
}

// TODO: clean up replaceText support hackz
function deletedText(doc, path, startOffset, endOffset) {
  if (startOffset === endOffset) return;
  var index = doc.getIndex('annotations');
  var annotations = index.get(path);
  var length = endOffset - startOffset;
  forEach(annotations, function(anno) {
    var pos1 = startOffset;
    var pos2 = endOffset;
    var start = anno.startOffset;
    var end = anno.endOffset;
    var newStart = start;
    var newEnd = end;
    if (pos2 <= start) {
      newStart -= length;
      newEnd -= length;
      doc.set([anno.id, 'startOffset'], newStart);
      doc.set([anno.id, 'endOffset'], newEnd);
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
        if (start !== newStart) {
          doc.set([anno.id, 'startOffset'], newStart);
        }
        if (end !== newEnd) {
          doc.set([anno.id, 'endOffset'], newEnd);
        }
      }
    }
  });
  // same for container annotation anchors
  index = doc.getIndex('container-annotation-anchors');
  var anchors = index.get(path);
  var containerAnnoIds = [];
  forEach(anchors, function(anchor) {
    containerAnnoIds.push(anchor.id);
    var pos1 = startOffset;
    var pos2 = endOffset;
    var start = anchor.offset;
    var changed = false;
    if (pos2 <= start) {
      start -= length;
      changed = true;
    } else {
      if (pos1 <= start) {
        var newStart = start - Math.min(pos2-pos1, start-pos1);
        if (start !== newStart) {
          start = newStart;
          changed = true;
        }
      }
    }
    if (changed) {
      var property = (anchor.isStart?'startOffset':'endOffset');
      doc.set([anchor.id, property], start);
    }
  });
  // check all anchors after that if they have collapsed and remove the annotation in that case
  forEach(uniq(containerAnnoIds), function(id) {
    var anno = doc.get(id);
    var annoSel = anno.getSelection();
    if(annoSel.isCollapsed()) {
      // console.log("...deleting container annotation because it has collapsed" + id);
      doc.delete(id);
    }
  });
}

// used when breaking a node to transfer annotations to the new property
function transferAnnotations(doc, path, offset, newPath, newOffset) {
  var index = doc.getIndex('annotations');
  var annotations = index.get(path, offset);
  forEach(annotations, function(a) {
    var isInside = (offset > a.startOffset && offset < a.endOffset);
    var start = a.startOffset;
    var end = a.endOffset;
    var newStart, newEnd;
    // 1. if the cursor is inside an annotation it gets either split or truncated
    if (isInside) {
      // create a new annotation if the annotation is splittable
      if (a.canSplit()) {
        var newAnno = a.toJSON();
        newAnno.id = uuid(a.type + "_");
        newAnno.startOffset = newOffset;
        newAnno.endOffset = newOffset + a.endOffset - offset;
        newAnno.path = newPath;
        doc.create(newAnno);
      }
      // in either cases truncate the first part
      newStart = a.startOffset;
      newEnd = offset;
      // if after truncate the anno is empty, delete it
      if (newEnd === newStart) {
        doc.delete(a.id);
      }
      // ... otherwise update the range
      else {
        if (newStart !== start) {
          doc.set([a.id, "startOffset"], newStart);
        }
        if (newEnd !== end) {
          doc.set([a.id, "endOffset"], newEnd);
        }
      }
    }
    // 2. if the cursor is before an annotation then simply transfer the annotation to the new node
    else if (a.startOffset >= offset) {
      // Note: we are preserving the annotation so that anything which is connected to the annotation
      // remains valid.
      newStart = newOffset + a.startOffset - offset;
      newEnd = newOffset + a.endOffset - offset;
      doc.set([a.id, "path"], newPath);
      doc.set([a.id, "startOffset"], newStart);
      doc.set([a.id, "endOffset"], newEnd);
    }
  });
  // same for container annotation anchors
  index = doc.getIndex('container-annotation-anchors');
  var anchors = index.get(path);
  var containerAnnoIds = [];
  forEach(anchors, function(anchor) {
    containerAnnoIds.push(anchor.id);
    var start = anchor.offset;
    if (offset <= start) {
      var pathProperty = (anchor.isStart?'startPath':'endPath');
      var offsetProperty = (anchor.isStart?'startOffset':'endOffset');
      doc.set([anchor.id, pathProperty], newPath);
      doc.set([anchor.id, offsetProperty], newOffset + anchor.offset - offset);
    }
  });
  // check all anchors after that if they have collapsed and remove the annotation in that case
  forEach(uniq(containerAnnoIds), function(id) {
    var anno = doc.get(id);
    var annoSel = anno.getSelection();
    if(annoSel.isCollapsed()) {
      // console.log("...deleting container annotation because it has collapsed" + id);
      doc.delete(id);
    }
  });
}

export default {
  insertedText: insertedText,
  deletedText: deletedText,
  transferAnnotations: transferAnnotations
}

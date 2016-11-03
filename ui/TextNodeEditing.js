import isArrayEqual from '../util/isArrayEqual'
import Coordinate from '../model/Coordinate'
import Range from '../model/Range'

class TextNodeEditing {

  /*
    <-->: anno
    |--|: area of change
    I: <--> |--|     :   nothing
    II: |--| <-->    :   move both by total span+L
    III: |-<-->-|    :   delete anno
    IV: |-<-|->      :   move start by diff to start+L, and end by total span+L
    V: <-|->-|       :   move end by diff to start+L
    VI: <-|--|->     :   move end by total span+L
  */
  type(tx, range, text) {
    range = this._normalizeRange(tx, range)
    // console.log('### typing over range', range.toString())
    let start = range.start
    let end = range.end
    if (!isArrayEqual(start.path, end.path)) {
      throw new Error('Unsupported state: range should be on one property')
    }
    let realPath = tx.getRealPath(start.path)
    let startOffset = start.offset
    let endOffset = end.offset
    let typeover = !range.isCollapsed()
    let L = text.length
    // delete selected text
    if (typeover) {
      tx.update(realPath, { delete: {start: startOffset, end: endOffset } })
    }
    // insert new text
    tx.update(realPath, { insert: { offset: startOffset, value: text } })
    // update annotations
    let annos = tx.getAnnotations(realPath)
    annos.forEach(function(anno) {
      let annoStart = anno.start.offset
      let annoEnd = anno.end.offset
      // I anno is before
      if (annoEnd<startOffset) {
        return
      }
      // II anno is after
      else if (annoStart>=endOffset) {
        tx.update([anno.id, 'start'], { shift: startOffset-endOffset+L })
        tx.update([anno.id, 'end'], { shift: startOffset-endOffset+L })
      }
      // III anno is deleted
      else if (annoStart>=startOffset && annoEnd<endOffset) {
        tx.delete(anno.id)
      }
      // IV anno.start between and anno.end after
      else if (annoStart>=startOffset && annoEnd>=endOffset) {
        // do not move start if typing over
        if (annoStart>startOffset || !typeover) {
          tx.update([anno.id, 'start'], { shift: startOffset-annoStart+L })
        }
        tx.update([anno.id, 'end'], { shift: startOffset-endOffset+L })
      }
      // V anno.start before and anno.end between
      else if (annoStart<startOffset && annoEnd<endOffset) {
        // NOTE: here the anno gets expanded (that's the common way)
        tx.update([anno.id, 'end'], { shift: startOffset-annoEnd+L })
      }
      // VI anno.start before and anno.end after
      else if (annoStart<startOffset && annoEnd>=endOffset) {
        tx.update([anno.id, 'end'], { shift: startOffset-endOffset+L })
      }
      else {
        console.warn('TODO: handle annotation update case.')
      }
    })
  }

  /*
    <-->: anno
    |--|: area of change
    I: <--> |--|     :   nothing
    II: |--| <-->    :   move both by total span
    III: |-<-->-|    :   delete anno
    IV: |-<-|->      :   move start by diff to start, and end by total span
    V: <-|->-|       :   move end by diff to start
    VI: <-|--|->     :   move end by total span
  */
  delete(tx, range) {
    range = this._normalizeRange(tx, range)
    let start = range.start
    let end = range.end
    if (!isArrayEqual(start.path, end.path)) {
      throw new Error('Unsupported state: range should be on one property')
    }
    let realPath = tx.getRealPath(start.path)
    let startOffset = start.offset
    let endOffset = end.offset
    tx.update(realPath, { delete: { start: startOffset, end: endOffset } })
    // update annotations
    let annos = tx.getAnnotations(realPath)
    annos.forEach(function(anno) {
      let annoStart = anno.start.offset
      let annoEnd = anno.end.offset
      // I anno is before
      if (annoEnd<=startOffset) {
        return
      }
      // II anno is after
      else if (annoStart>=endOffset) {
        tx.update([anno.id, 'start'], { shift: startOffset-endOffset })
        tx.update([anno.id, 'end'], { shift: startOffset-endOffset })
      }
      // III anno is deleted
      else if (annoStart>=startOffset && annoEnd<=endOffset) {
        tx.delete(anno.id)
      }
      // IV anno.start between and anno.end after
      else if (annoStart>=startOffset && annoEnd>=endOffset) {
        if (annoStart>startOffset) {
          tx.update([anno.id, 'start'], { shift: startOffset-annoStart })
        }
        tx.update([anno.id, 'end'], { shift: startOffset-endOffset })
      }
      // V anno.start before and anno.end between
      else if (annoStart<=startOffset && annoEnd<=endOffset) {
        tx.update([anno.id, 'end'], { shift: startOffset-annoEnd })
      }
      // VI anno.start before and anno.end after
      else if (annoStart<startOffset && annoEnd >= endOffset) {
        tx.update([anno.id, 'end'], { shift: startOffset-endOffset })
      }
      else {
        console.warn('TODO: handle annotation update case.')
      }
    })
  }

  _normalizeRange(tx, range) {
    // HACK: this is not really cool
    let start = range.start
    let end = range.end
    if (range.start === 'before') {
      start = { path: tx.get(end.path[0]).getTextPath(), offset: 0 }
    } else if (range.start.path.length === 1) {
      start = { path: tx.get(start.path[0]).getTextPath(), offset: range.start.offset }
    }
    if (range.end === 'after') {
      end = { path:  tx.get(start.path[0]).getTextPath(), offset: tx.get(start.path[0]).getText().length }
    } else if (range.end.path.length === 1) {
      end = { path: tx.get(end.path[0]).getTextPath(), offset: tx.get(end.path[0]).getText().length }
    }
    if (!start._isCoordinate) start = new Coordinate(start.path, start.offset)
    if (!end._isCoordinate) end = new Coordinate(end.path, end.offset)
    return new Range(start, end)
  }
}

export default TextNodeEditing
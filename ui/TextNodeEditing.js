import isArrayEqual from '../util/isArrayEqual'
import Coordinate from '../model/Coordinate'
import Range from '../model/Range'
import annotationHelpers from '../model/annotationHelpers'

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
      tx.update(realPath, { type: 'delete', start: startOffset, end: endOffset })
    }
    // insert new text
    tx.update(realPath, { type: 'insert', start: startOffset, text: text })
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
        tx.update([anno.id, 'start'], { type: 'shift', value: startOffset-endOffset+L })
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset+L })
      }
      // III anno is deleted
      else if (annoStart>=startOffset && annoEnd<endOffset) {
        tx.delete(anno.id)
      }
      // IV anno.start between and anno.end after
      else if (annoStart>=startOffset && annoEnd>=endOffset) {
        // do not move start if typing over
        if (annoStart>startOffset || !typeover) {
          tx.update([anno.id, 'start'], { type: 'shift', value: startOffset-annoStart+L })
        }
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset+L })
      }
      // V anno.start before and anno.end between
      else if (annoStart<startOffset && annoEnd<endOffset) {
        // NOTE: here the anno gets expanded (that's the common way)
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-annoEnd+L })
      }
      // VI anno.start before and anno.end after
      else if (annoStart<startOffset && annoEnd>=endOffset) {
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset+L })
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
    tx.update(realPath, { type: 'delete', start: startOffset, end: endOffset })
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
        tx.update([anno.id, 'start'], { type: 'shift', value: startOffset-endOffset })
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset })
      }
      // III anno is deleted
      else if (annoStart>=startOffset && annoEnd<=endOffset) {
        tx.delete(anno.id)
      }
      // IV anno.start between and anno.end after
      else if (annoStart>=startOffset && annoEnd>=endOffset) {
        if (annoStart>startOffset) {
          tx.update([anno.id, 'start'], { type: 'shift', value: startOffset-annoStart })
        }
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset })
      }
      // V anno.start before and anno.end between
      else if (annoStart<=startOffset && annoEnd<=endOffset) {
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-annoEnd })
      }
      // VI anno.start before and anno.end after
      else if (annoStart<startOffset && annoEnd >= endOffset) {
        tx.update([anno.id, 'end'], { type: 'shift', value: startOffset-endOffset })
      }
      else {
        console.warn('TODO: handle annotation update case.')
      }
    })
  }

  break(tx, node, coor, container) {
    let path = coor.path
    let offset = coor.offset
    let nodePos = container.getPosition(node.id)
    let text = node.getText()

    // when breaking at the first position, a new node of the same
    // type will be inserted.
    if (offset === 0) {
      let newNode = tx.create({
        type: node.type,
        content: ""
      })
      // show the new node
      container.show(newNode.id, nodePos)
      tx.selection = tx.createSelection(path, 0)
    }
    // otherwise split the text property and create a new paragraph node with trailing text and annotations transferred
    else {
      let newNode = node.toJSON()
      delete newNode.id
      newNode.content = text.substring(offset)
      // if at the end insert a default text node no matter in which text node we are
      if (offset === text.length) {
        newNode.type = tx.getSchema().getDefaultTextType()
      }
      newNode = tx.create(newNode)
      // Now we need to transfer annotations
      if (offset < text.length) {
        // transfer annotations which are after offset to the new node
        annotationHelpers.transferAnnotations(tx, path, offset, newNode.getTextPath(), 0)
        // truncate the original property
        tx.update(path, { type: 'delete', start: offset, end: text.length })
      }
      // show the new node
      container.show(newNode.id, nodePos+1)
      // update the selection
      tx.selection = tx.createSelection(newNode.getTextPath(), 0)
    }
  }

  merge(tx, node, coor, container, direction, previous, next) {
    let first, second
    if (direction === 'left') {
      first = previous
      second = node
    } else if (direction === 'right') {
      first = node
      second = next
    }
    if (!first || !second || !first.isText() || !second.isText()) {
      console.error('Can only merge text nodes.')
      return
    }
    let firstPath = first.getTextPath()
    let firstText = first.getText()
    let firstLength = firstText.length
    let secondPath = second.getTextPath()
    let secondText = second.getText()
    if (firstLength === 0) {
      // hide the second node
      container.hide(firstPath[0])
      // delete the second node
      tx.delete(firstPath[0])
      // set the selection to the end of the first component
      tx.selection = tx.createSelection({
        type: 'property',
        path: secondPath,
        startOffset: 0
      })
    } else {
      // append the second text
      tx.update(firstPath, { type: 'insert', start: firstLength, text: secondText })
      // transfer annotations
      annotationHelpers.transferAnnotations(tx, secondPath, 0, firstPath, firstLength)
      // hide the second node
      container.hide(secondPath[0])
      // delete the second node
      tx.delete(secondPath[0])
      // set the selection to the end of the first component
      tx.selection = tx.createSelection({
        type: 'property',
        path: firstPath,
        startOffset: firstLength
      })
    }
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
import isArray from '../util/isArray'
import isEqual from '../util/isEqual'
import ObjectOperation from './ObjectOperation'

/*
  Transforms change A with B, as if A was done before B.
  A' and B' can be used to update two clients to get to the
  same document content.

     / A - B' \
  v_n          v_n+1
     \ B - A' /
*/
export function transformDocumentChange (A, B, options = {}) {
  _transformInplaceBatch(A, B, options)
}

export function transformSelection (sel, a, options) {
  let newSel = sel.clone()
  let hasChanged = _transformSelectionInplace(newSel, a, options)
  if (hasChanged) {
    return newSel
  } else {
    return sel
  }
}

function _transformInplaceSingle (a, b, options = {}) {
  // TODO: we should introduce a means to control individually whether or not ops should be changed inplace
  let _options = Object.assign({ inplace: true }, options)
  for (let i = 0; i < a.ops.length; i++) {
    let opA = a.ops[i]
    for (let j = 0; j < b.ops.length; j++) {
      let opB = b.ops[j]
      // ATTENTION: order of arguments is important.
      // First argument is the dominant one, i.e. it is treated as if it was applied before
      ObjectOperation.transform(opA, opB, _options)
    }
  }
  if (a.before) {
    _transformSelectionInplace(a.before.selection, b, _options)
  }
  if (a.after) {
    _transformSelectionInplace(a.after.selection, b, _options)
  }
  if (b.before) {
    _transformSelectionInplace(b.before.selection, a, _options)
  }
  if (b.after) {
    _transformSelectionInplace(b.after.selection, a, _options)
  }
}

function _transformInplaceBatch (A, B, options = {}) {
  if (!isArray(A)) {
    A = [A]
  }
  if (!isArray(B)) {
    B = [B]
  }
  for (let i = 0; i < A.length; i++) {
    let a = A[i]
    for (let j = 0; j < B.length; j++) {
      let b = B[j]
      _transformInplaceSingle(a, b, options)
    }
  }
}

function _transformSelectionInplace (sel, a, options = {}) {
  if (!sel || (!sel.isPropertySelection() && !sel.isContainerSelection())) {
    return false
  }
  let ops = a.ops
  let hasChanged = false
  let isCollapsed = sel.isCollapsed()
  for (let i = 0; i < ops.length; i++) {
    let op = ops[i]
    hasChanged |= _transformCoordinateInplace(sel.start, op, options)
    if (!isCollapsed) {
      hasChanged |= _transformCoordinateInplace(sel.end, op, options)
    } else {
      if (sel.isContainerSelection()) {
        sel.end.path = sel.start.path
      }
      sel.end.offset = sel.start.offset
    }
  }
  return hasChanged
}

function _transformCoordinateInplace (coor, op, options) {
  if (!isEqual(op.path, coor.path)) return false
  let hasChanged = false
  if (op.type === 'update' && op.propertyType === 'string') {
    let diff = op.diff
    let newOffset
    if (diff.isInsert() && diff.pos <= coor.offset) {
      newOffset = coor.offset + diff.str.length
      // console.log('Transforming coordinate after inserting %s chars:', diff.str.length, coor.toString(), '->', newOffset)
      coor.offset = newOffset
      hasChanged = true
    } else if (diff.isDelete() && diff.pos <= coor.offset) {
      newOffset = Math.max(diff.pos, coor.offset - diff.str.length)
      // console.log('Transforming coordinate after deleting %s chars:', diff.str.length, coor.toString(), '->', newOffset)
      coor.offset = newOffset
      hasChanged = true
    }
  }
  return hasChanged
}

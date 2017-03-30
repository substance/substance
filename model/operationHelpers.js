import { isArray, isEqual } from '../util'
import ObjectOperation from './ObjectOperation'

/*
  Transforms change A with B, as if A was done before B.
  A' and B' can be used to update two clients to get to the
  same document content.

     / A - B' \
  v_n          v_n+1
     \ B - A' /
*/
export function transformDocumentChange(A, B) {
  _transformInplaceBatch(A, B)
}

export function transformSelection(sel, a) {
  let newSel = sel.clone()
  let hasChanged = _transformSelectionInplace(newSel, a)
  if (hasChanged) {
    return newSel
  } else {
    return sel
  }
}

function _transformInplaceSingle(a, b) {
  for (let i = 0; i < a.ops.length; i++) {
    let a_op = a.ops[i]
    for (let j = 0; j < b.ops.length; j++) {
      let b_op = b.ops[j]
      // ATTENTION: order of arguments is important.
      // First argument is the dominant one, i.e. it is treated as if it was applied before
      ObjectOperation.transform(a_op, b_op, {inplace: true})
    }
  }
  if (a.before) {
    _transformSelectionInplace(a.before.selection, b)
  }
  if (a.after) {
    _transformSelectionInplace(a.after.selection, b)
  }
  if (b.before) {
    _transformSelectionInplace(b.before.selection, a)
  }
  if (b.after) {
    _transformSelectionInplace(b.after.selection, a)
  }
}

function _transformInplaceBatch(A, B) {
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
      _transformInplaceSingle(a,b)
    }
  }
}

function _transformSelectionInplace(sel, a) {
  if (!sel || (!sel.isPropertySelection() && !sel.isContainerSelection()) ) {
    return false
  }
  let ops = a.ops
  let hasChanged = false
  let isCollapsed = sel.isCollapsed()
  for(let i=0; i<ops.length; i++) {
    let op = ops[i]
    hasChanged |= _transformCoordinateInplace(sel.start, op)
    if (!isCollapsed) {
      hasChanged |= _transformCoordinateInplace(sel.end, op)
    } else {
      if (sel.isContainerSelection()) {
        sel.end.path = sel.start.path
      }
      sel.end.offset = sel.start.offset
    }
  }
  return hasChanged
}

function _transformCoordinateInplace(coor, op) {
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

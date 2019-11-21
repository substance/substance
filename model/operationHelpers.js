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
  _transformBatch(A, B, options)
}

export function transformSelection (sel, a, options) {
  const newSel = sel.clone()
  const hasChanged = _transformSelectionInplace(newSel, a, options)
  if (hasChanged) {
    return newSel
  } else {
    return sel
  }
}

function _transformSingle (a, b, options = {}) {
  // For OT no options needed
  // For doc.rebase() we use immutableLeft = true
  const immutableLeft = options.immutableLeft
  const immutableRight = options.immutableRight
  for (let i = 0; i < a.ops.length; i++) {
    for (let j = 0; j < b.ops.length; j++) {
      let opA = a.ops[i]
      let opB = b.ops[j]
      if (immutableLeft) {
        opA = opA.clone()
      }
      if (immutableRight) {
        opB = opB.clone()
      }
      // ATTENTION: order of arguments is important.
      // First argument is the dominant one, i.e. it is treated as if it was applied before
      ObjectOperation.transform(opA, opB, options)
    }
  }
  if (!immutableLeft) {
    if (a.before) {
      _transformSelectionInplace(a.before.selection, b, options)
    }
    if (a.after) {
      _transformSelectionInplace(a.after.selection, b, options)
    }
  }
  if (!immutableRight) {
    if (b.before) {
      _transformSelectionInplace(b.before.selection, a, options)
    }
    if (b.after) {
      _transformSelectionInplace(b.after.selection, a, options)
    }
  }
}

function _transformBatch (A, B, options = {}) {
  if (!isArray(A)) {
    A = [A]
  }
  if (!isArray(B)) {
    B = [B]
  }
  for (let i = 0; i < A.length; i++) {
    const a = A[i]
    for (let j = 0; j < B.length; j++) {
      const b = B[j]
      _transformSingle(a, b, options)
    }
  }
}

function _transformSelectionInplace (sel, a, options = {}) {
  if (!sel || (!sel.isPropertySelection() && !sel.isContainerSelection())) {
    return false
  }
  const ops = a.ops
  let hasChanged = false
  const isCollapsed = sel.isCollapsed()
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]
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
    const diff = op.diff
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

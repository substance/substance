/* eslint-disable no-unused-vars */

import isEqual from '../util/isEqual'
import ObjectOperation from './data/ObjectOperation'

const MAXIMUM_CHANGE_DURATION = 1500

class DefaultChangeCompressor {

  shouldMerge(lastChange, newChange) {
    return false
    // var now = Date.now()
    // // var shouldMerge = (now - lastChange.timestamp < MAXIMUM_CHANGE_DURATION)
    // var shouldMerge = true
    // if (shouldMerge) {
    //   // we are only interested in compressing subsequent operations while typing
    //   // TODO: we could make our lifes easier by just tagging these changes
    //   var firstOp = lastChange.ops[0]
    //   var secondOp = newChange.ops[0]
    //   var firstDiff = firstOp.diff
    //   var secondDiff = secondOp.diff
    //   // HACK: this check is pretty optimistic. We should tag changes, so that
    //   // we can compress only changes related to typing here.
    //   shouldMerge = (
    //     firstOp.isUpdate('string') &&
    //     secondOp.isUpdate('string') &&
    //     secondDiff.getLength() === 1 &&
    //     firstDiff.type === secondDiff.type &&
    //     isEqual(firstOp.path, secondOp.path)
    //   )
    // }

    // return shouldMerge
  }

  /*
    This compresser tries to merge subsequent text operation
    to create more natural changes for persisting.

    @param {DocumentChange} first
    @param {DocumentChange} second
    @returns {boolean} `true` if the second could be merged into the first, `false` otherwise
  */
  merge(first, second) {
    // we are only interested in compressing subsequent operations while typing
    // TODO: we could make our lifes easier by just tagging these changes
    var firstOp = first.ops[0]
    var secondOp = second.ops[0]
    var firstDiff = firstOp.diff
    var secondDiff = secondOp.diff
    var mergedOp = false
    if (firstDiff.isInsert()) {
      if (firstDiff.pos+firstDiff.getLength() === secondDiff.pos) {
        mergedOp = firstOp.toJSON()
        mergedOp.diff.str += secondDiff.str
      }
    }
    else if (firstDiff.isDelete()) {
      // TODO: here is one case not covered
      // "012345": del(3, '3') del(3, '4') -> del(3, '34')
      if (firstDiff.pos === secondDiff.pos) {
        mergedOp = firstOp.toJSON()
        mergedOp.diff.str += secondDiff.str
      } else if (secondDiff.pos+secondDiff.getLength() === firstDiff.pos) {
        mergedOp = firstOp.toJSON()
        mergedOp.diff = secondDiff
        mergedOp.diff.str += firstDiff.str
      }
    }
    if (mergedOp) {
      first.ops[0] = ObjectOperation.fromJSON(mergedOp)
      if (first.ops.length > 1) {
        // just concatenating the other ops
        // TODO: we could compress the other ops as well, e.g., updates of annotation
        // ranges as they follow the same principle as the originating text operation.
        first.ops = first.ops.concat(second.ops.slice(1))
        first.after = second.after
      }
      return true
    }
    return false
  }

}

export default DefaultChangeCompressor

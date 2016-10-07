import annotationHelpers from '../annotationHelpers'
import Coordinate from '../Coordinate'

function updateAnnotations(tx, args) {
  let op = args.op
  if (op.isUpdate()) {
    let diff = op.diff
    if (diff.isInsert()) {
      return _upateAfterInsert(tx, args)
    } else if (diff.isDelete()) {
      return _updateAfterDelete(tx, args)
    }
  } else {
    throw new Error('Only text updates are supported.')
  }
  return args
}

function _upateAfterInsert(tx, args) {
  let op = args.op
  let diff = op.diff
  annotationHelpers.insertedText(tx, new Coordinate(op.path, diff.pos), diff.getLength(), args.ignoredAnnotations)
  return args
}

function _updateAfterDelete(tx, args) {
  let op = args.op
  let diff = op.diff
  annotationHelpers.deletedText(tx, op.path, diff.pos, diff.pos + diff.getLength(), args.replaceTextSupport)
  return args
}

export default updateAnnotations

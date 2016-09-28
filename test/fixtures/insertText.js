import isArray from 'lodash/isArray'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'
import _insertText from '../../model/transform/insertText'

export default function insertText(tx, args) {
  var path = args.path
  if (!isArray(path)) {
    throw new Error('args.path is mandatory')
  }
  var pos = args.pos
  if (!isNumber(pos)) {
    throw new Error('args.pos is mandatory')
  }
  var text = args.text
  if (!isString(text)) {
    throw new Error('args.text is mandatory')
  }
  var sel = tx.createSelection({
    type: 'property',
    path: path,
    startOffset: pos,
    endOffset: pos
  })
  _insertText(tx, {
    selection: sel,
    text: text || '$$$'
  })
}

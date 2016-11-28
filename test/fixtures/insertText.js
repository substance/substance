import isArray from 'lodash/isArray'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'

export default function insertText(tx, path, pos, text) {
  if (!isArray(path)) throw new Error('args.path is mandatory')
  if (!isNumber(pos)) throw new Error('args.pos is mandatory')
  if (!isString(text)) throw new Error('args.text is mandatory')
  tx.select({
    startPath: path,
    startOffset: pos
  })
  tx.insertText(tx, text)
}

import isFunction from 'lodash/isFunction'
import DocumentSession from '../../model/DocumentSession'

export default function createChangeset(doc, fn) {
  if (!doc._isDocument || !isFunction(fn)) {
    throw new Error('Illegal arguments')
  }
  var session = new DocumentSession(doc)
  var change = session.transaction(fn)
  return [change.toJSON()]
}

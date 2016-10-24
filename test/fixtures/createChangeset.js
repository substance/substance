import isFunction from 'lodash/isFunction'
import EditorSession from '../../model/EditorSession'
import Configurator from '../../util/Configurator'

export default function createChangeset(doc, fn) {
  if (!doc._isDocument || !isFunction(fn)) {
    throw new Error('Illegal arguments')
  }
  var session = new EditorSession(doc, {
    configurator: new Configurator()
  })
  var change = session.transaction(fn)
  return [change.toJSON()]
}

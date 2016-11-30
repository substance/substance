import isFunction from 'lodash/isFunction'
import DocumentChange from '../../model/DocumentChange'
import EditingInterface from '../../model/EditingInterface'
import TransactionDocument from '../../model/TransactionDocument'

export default function createChangeset(doc, fn) {
  if (!doc._isDocument || !isFunction(fn)) {
    throw new Error('Illegal arguments')
  }
  let txDoc = new TransactionDocument(doc)
  let tx = new EditingInterface(txDoc)
  fn(tx)
  txDoc.dispose()
  return [new DocumentChange(txDoc.ops, {}, {}).toJSON()]
}

import DocumentChange from '../../model/DocumentChange'
import EditingInterface from '../../model/EditingInterface'
import TransactionDocument from '../../model/TransactionDocument'

/*
  Create a changeset

  Allows one or more functions to be passed, which will each represent a change
  in the result.
*/
export default function createChangeset(doc, fns) {
  if (!doc._isDocument) {
    throw new Error('Illegal arguments')
  }
  if (!Array.isArray(fns)) {
    fns = [ fns ]
  }

  let txDoc = new TransactionDocument(doc)
  let tx = new EditingInterface(txDoc)
  let opCount = 0
  let changes = []

  fns.forEach((fn) => {
    fn(tx)
    let opsForChange = txDoc.ops.slice(opCount)
    changes.push(new DocumentChange(opsForChange, {}, {}).toJSON())
    opCount = txDoc.ops.length
  })
  txDoc.dispose()
  return changes
}

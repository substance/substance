import { ChangeRecorder } from 'substance'

/*
  Create a changeset

  Allows one or more functions to be passed, which will each represent a change
  in the result.
*/
export default function createChangeset (doc, fns) {
  if (!doc._isDocument) {
    throw new Error('Illegal arguments')
  }
  if (!Array.isArray(fns)) {
    fns = [ fns ]
  }
  let tx = new ChangeRecorder(doc)
  let changes = []
  fns.forEach((fn) => {
    fn(tx)
    changes.push(tx.generateChange())
  })
  tx.dispose()
  return changes
}

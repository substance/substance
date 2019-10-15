import { test } from 'substance-test'
import { ChangeRecorder, DocumentChange } from 'substance'
import simple from './fixture/simple'
import createTestArticle from './shared/createTestArticle'

test('DocumentChange: hasUpdated()', t => {
  let tx = setup(simple)
  let path = ['p1', 'content']
  // updating a property
  tx.setSelection({
    type: 'property',
    path,
    startOffset: 1
  })
  tx.insertText('X')
  let change = tx.generateChange()
  t.ok(change.hasUpdated(path), 'should tell that property has been updated')
  t.ok(change.hasUpdated(path[0]), 'should tell that node has been updated')
  // deleting a node
  tx.delete('p2')
  change = tx.generateChange()
  t.ok(change.hasDeleted('p2'), 'should tell that node has been deleted')
  // update but then delete a node
  tx.setSelection({
    type: 'property',
    path,
    startOffset: 1
  })
  tx.insertText('X')
  tx.delete('p1')
  change = tx.generateChange()
  t.notOk(change.hasUpdated(path), 'should not tell that property has been updated')
  t.ok(change.hasDeleted('p1'), 'should tell that node has been deleted')
  t.end()
})

test('DocumentChange: serialize() and deserialize()', t => {
  let tx = setup(simple)
  let path = ['p1', 'content']
  // updating a property
  let selStart = tx.setSelection({
    type: 'property',
    path,
    startOffset: 1
  })
  tx.insertText('X')
  let change = tx.generateChange()
  let selEnd = tx.selection
  change.before.selection = selStart
  change.after.selection = selEnd

  let serialized = change.serialize()
  let deserialized = DocumentChange.deserialize(serialized)

  t.deepEqual(deserialized.ops.map(o => o.toJSON()), change.ops.map(o => o.toJSON()), 'ops should be equal after deserialization')
  t.ok(selStart.equals(deserialized.before.selection), 'selection (before) should have been deserialized too')
  t.ok(selEnd.equals(deserialized.after.selection), 'selection (after) should have been deserialized too')
  t.end()
})

function setup (...seeds) {
  let doc = createTestArticle()
  seeds.forEach(s => s(doc, doc.get('body')))
  return new ChangeRecorder(doc)
}

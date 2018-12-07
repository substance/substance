import { DocumentIndex } from 'substance'
import { test, spy } from 'substance-test'
import fixture from './fixture/createTestArticle'
import simple from './fixture/simple'

test('DocumentIndex: index should have been warmed up with existing nodes.', t => {
  let { doc, index } = _setup()
  let N = Object.keys(doc.getNodes()).length
  t.equal(index.select.callCount, N, 'index.select() should have been called for all nodes')
  t.equal(index.create.callCount, N, 'index.create() should have been called for all nodes')
  t.end()
})

test('DocumentIndex: index should be updated correctly when creating a node.', t => {
  let { doc, index } = _setup()
  _reset(index)
  let p = doc.create({type: 'paragraph', id: 'test'})
  t.equal(index.create.callCount, 1, 'index.create() should have been called')
  t.deepEqual(index.create.args, [p], '.. with correct arguments')
  t.end()
})

test('DocumentIndex: index should be updated correctly when deleting a node.', t => {
  let { doc, index } = _setup()
  _reset(index)
  let p1 = doc.get('p1')
  doc.delete('p1')
  t.equal(index.delete.callCount, 1, 'index.delete() should have been called')
  t.deepEqual(index.delete.args, [p1], '.. with correct arguments')
  t.end()
})

test('DocumentIndex: index should be updated correctly when setting a node property.', t => {
  let { doc, index } = _setup()
  _reset(index)
  doc.set(['body', 'nodes'], ['p1', 'p2', 'p3'])
  t.equal(index.update.callCount, 1, 'index.update() should have been called')
  t.deepEqual(index.update.args, [doc.get('body'), ['body', 'nodes'], ['p1', 'p2', 'p3'], ['p1', 'p2', 'p3', 'p4']], '.. with correct arguments')
  t.end()
})

test('DocumentIndex: index should be updated correctly when updating a node property.', t => {
  let { doc, index } = _setup()
  _reset(index)
  let body = doc.get('body')
  body.hide('p4')
  t.equal(index.update.callCount, 1, 'index.update() should have been called')
  t.deepEqual(index.update.args, [doc.get('body'), ['body', 'nodes'], ['p1', 'p2', 'p3'], ['p1', 'p2', 'p3', 'p4']], '.. with correct arguments')
  t.end()
})

class TestIndex extends DocumentIndex {
  clear () {}
  select () { return true }
  create () {}
  delete () {}
  update () {}
}

const methods = ['select', 'create', 'delete', 'update']

function _setup () {
  let doc = fixture(simple)
  let index = new TestIndex()
  methods.forEach(m => spy(index, m))
  doc.addIndex('test', index)
  return { doc, index }
}

function _reset (index) {
  methods.forEach(m => index[m].reset())
}


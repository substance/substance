import { module } from 'substance-test'

import DocumentSession from '../../model/DocumentSession'
import fixture from '../fixtures/createTestArticle'
import headersAndParagraphs from '../fixtures/headersAndParagraphs'

const test = module('model/PathEventProxy')

function docWithTestNodes(tx) {
  headersAndParagraphs(tx)
  tx.create({
    type: "test-node",
    id: "test",
    arrayVal: [1,2,3]
  })
}

test("Updating a property", function(t) {
  var doc = fixture(docWithTestNodes)
  var callCount = 0
  doc.getEventProxy('path').on(['test', 'arrayVal'], function() {
    callCount++
  })
  doc.update(['test', 'arrayVal'], { insert: { offset: 1, value: '1000' } } )
  t.equal(callCount, 1, "Event proxy listener should have been called.")
  t.end()
})

test("Setting a property", function(t) {
  var doc = fixture(docWithTestNodes)
  var callCount = 0
  doc.getEventProxy('path').on(['test', 'arrayVal'], function() {
    callCount++
  })
  doc.set(['test', 'arrayVal'], [1,1,1])
  t.equal(callCount, 1, "Event proxy listener should have been called.")
  t.end()
})

test("Setting a property and deleting the node afterwards", function(t) {
  var doc = fixture(docWithTestNodes)
  var docSession = new DocumentSession(doc)
  var callCount = 0
  doc.getEventProxy('path').on(['test', 'arrayVal'], function() {
    callCount++
  })
  docSession.transaction(function(tx) {
    tx.set(['test', 'arrayVal'], [1,1,1])
    tx.delete('test')
  })
  t.equal(callCount, 0, "Event proxy listener doesn't get called when node is deleted.")
  t.end()
})

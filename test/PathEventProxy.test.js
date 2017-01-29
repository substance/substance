import { module } from 'substance-test'

import EditorSession from '../model/EditorSession'
import Configurator from '../util/Configurator'
import fixture from './fixture/createTestArticle'
import headersAndParagraphs from './fixture/headersAndParagraphs'

const test = module('PathEventProxy')

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
  doc.update(['test', 'arrayVal'], { type: 'insert', pos: 1, value: '1000' } )
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
  var editorSession = new EditorSession(doc, { configurator: new Configurator() })
  var callCount = 0
  doc.getEventProxy('path').on(['test', 'arrayVal'], function() {
    callCount++
  })
  editorSession.transaction(function(tx) {
    tx.set(['test', 'arrayVal'], [1,1,1])
    tx.delete('test')
  })
  t.equal(callCount, 0, "Event proxy listener doesn't get called when node is deleted.")
  t.end()
})

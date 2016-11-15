import { module } from 'substance-test'
import EditorSession from '../../model/EditorSession'
import deleteNode from '../../model/transform/deleteNode'
import Configurator from '../../util/Configurator'
import fixture from '../fixtures/createTestArticle'
import containerAnnoSample from '../fixtures/containerAnnoSample'

const test = module('transform/deleteNode')

test("Delete a plain node", function(t) {
  var doc = fixture(containerAnnoSample)
  var editorSession = _createSession(doc)
  editorSession.transaction(function(tx, args) {
    args.nodeId = "p4"
    deleteNode(tx, args)
  })
  t.isNil(doc.get('p4'), "Node should have been deleted.")
  t.end()
})

test("Delete annotations when deleting a node", function(t) {
  var doc = fixture(containerAnnoSample)
  var editorSession = _createSession(doc)
  editorSession.transaction(function(tx) {
    tx.create({
      id: "test-anno",
      type: "annotation",
      path: ["p4", "content"],
      startOffset: 0, endOffset: 5
    })
  })
  t.notNil(doc.get("test-anno"))

  editorSession.transaction(function(tx, args) {
    args.nodeId = "p4"
    deleteNode(tx, args)
  })
  t.isNil(doc.get("test-anno"), "Annotation should have been deleted too.")
  t.end()
})

test("Move startAnchor of container annotation to next node.", function(t) {
  var doc = fixture(containerAnnoSample)
  var editorSession = _createSession(doc)
  editorSession.transaction(function(tx, args) {
    args.nodeId = "p1"
    deleteNode(tx, args)
  })
  var anno = doc.get('a1')
  t.deepEqual(anno.startPath, ["p2", "content"], "Start anchor should now be on second paragraph.")
  t.equal(anno.startOffset, 0)
  t.end()
})

test("Move endAnchor of container annotation to previous node.", function(t) {
  var doc = fixture(containerAnnoSample)
  var editorSession = _createSession(doc)
  editorSession.transaction(function(tx, args) {
    args.nodeId = "p3"
    deleteNode(tx, args)
  })
  var anno = doc.get('a1')
  var p2 = doc.get('p2')
  t.deepEqual(anno.endPath, ["p2", "content"], "End anchor should now be on second paragraph.")
  t.equal(anno.endOffset, p2.content.length)
  t.end()
})

function _createSession(doc) {
  return new EditorSession(doc, { configurator: new Configurator() })
}
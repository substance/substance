import { module } from 'substance-test'

import DocumentSession from '../../model/DocumentSession'
import SelectionState from '../../model/SelectionState'
import AnnotationCommand from '../../ui/AnnotationCommand'

import createTestArticle from '../fixtures/createTestArticle'
import containerAnnoSample from '../fixtures/containerAnnoSample'

const test = module('ui/AnnotationCommand')

class ToggleStrongCommand extends AnnotationCommand {
  constructor() {
    super({ name: 'strong', nodeType: 'strong' })
  }
}

function fixture() {
  var doc = createTestArticle(containerAnnoSample)
  // Create a second strong annotation to be fused
  doc.create({
    id: 'a3',
    type: 'strong',
    path: ['p1', 'content'],
    startOffset: 4,
    endOffset: 8
  })
  return doc
}

test("can 'create' property annotation", function(t) {
  var doc = fixture()
  var selectionState = new SelectionState(doc)
  var cmd = new ToggleStrongCommand()
  var sel = doc.createSelection(['p6', 'content'], 1, 6)
  selectionState.setSelection(sel)
  var cmdState = cmd.getCommandState({
    selectionState: selectionState
  })
  t.equal(cmdState.mode, 'create', "Mode should be correct.")
  t.end()
})

test("execute 'create' property annotation", function(t) {
  var doc = fixture()
  var docSession = new DocumentSession(doc)
  var cmd = new ToggleStrongCommand()
  var sel = doc.createSelection(['p6', 'content'], 1, 6)
  docSession.setSelection(sel)
  var res = cmd.execute({
    commandState: {
      mode: 'create'
    },
    documentSession: docSession,
    selectionState: docSession.getSelectionState()
  })
  var newAnno = res.anno
  t.notNil(newAnno, 'A new anno should have been created')
  newAnno = doc.get(newAnno.id)
  t.equal(newAnno.type, 'strong', '.. of correct type')
  t.deepEqual(newAnno.startPath, ['p6', 'content'], ".. with correct path")
  t.equal(newAnno.startOffset, 1, '.. with correct startOffset')
  t.equal(newAnno.endOffset, 6, '.. with correct endOffset')
  t.end()
})

test("can 'delete' property annotation", function(t) {
  var doc = fixture()
  var selectionState = new SelectionState(doc)
  var cmd = new ToggleStrongCommand()
  var sel = doc.createSelection(['p1', 'content'], 5, 7)
  selectionState.setSelection(sel)
  var cmdState = cmd.getCommandState({
    selectionState: selectionState
  })
  t.equal(cmdState.mode, 'delete', "Mode should be correct.")
  t.end()
})

test("execute 'delete' property annotation", function(t) {
  var doc = fixture()
  var selectionState = new SelectionState(doc)
  var cmd = new ToggleStrongCommand()
  var sel = doc.createSelection(['p1', 'content'], 5, 7)
  selectionState.setSelection(sel)
  var cmdState = cmd.getCommandState({
    selectionState: selectionState
  })
  t.equal(cmdState.mode, 'delete', "Mode should be correct.")
  t.end()
})

test("can 'expand' property annotation", function(t) {
  var doc = fixture()
  var docSession = new DocumentSession(doc)
  var cmd = new ToggleStrongCommand()
  var sel = doc.createSelection(['p1', 'content'], 5, 7)
  docSession.setSelection(sel)
  cmd.execute({
    commandState: {
      mode: 'delete'
    },
    documentSession: docSession,
    selectionState: docSession.getSelectionState()
  })
  t.isNil(doc.get('a3'), 'a3 should be gone.')
  t.end()
})

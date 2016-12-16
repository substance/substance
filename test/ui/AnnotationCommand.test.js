import { module } from 'substance-test'

import EditorSession from '../../model/EditorSession'
import SelectionState from '../../model/SelectionState'
import AnnotationCommand from '../../ui/AnnotationCommand'
import Configurator from '../../util/Configurator'

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
    start: { path: ['p1', 'content'], offset: 4 },
    end: { offset: 8 }
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
  var editorSession = new EditorSession(doc, {
    configurator: new Configurator()
  })
  var cmd = new ToggleStrongCommand()
  var sel = doc.createSelection(['p6', 'content'], 1, 6)
  editorSession.setSelection(sel)
  var res = cmd.execute({
    commandState: {
      mode: 'create'
    },
    editorSession: editorSession,
    selectionState: editorSession.getSelectionState()
  })
  var newAnno = res.anno
  t.notNil(newAnno, 'A new anno should have been created')
  newAnno = doc.get(newAnno.id)
  t.equal(newAnno.type, 'strong', '.. of correct type')
  t.deepEqual(newAnno.start.path, ['p6', 'content'], ".. with correct path")
  t.equal(newAnno.start.offset, 1, '.. with correct startOffset')
  t.equal(newAnno.end.offset, 6, '.. with correct endOffset')
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
  var editorSession = new EditorSession(doc, {
    configurator: new Configurator()
  })
  var cmd = new ToggleStrongCommand()
  var sel = doc.createSelection(['p1', 'content'], 5, 7)
  editorSession.setSelection(sel)
  cmd.execute({
    commandState: {
      mode: 'delete'
    },
    editorSession: editorSession,
    selectionState: editorSession.getSelectionState()
  })
  t.isNil(doc.get('a3'), 'a3 should be gone.')
  t.end()
})

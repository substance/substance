import { module } from 'substance-test'
import SelectionState from '../model/SelectionState'
import AnnotationCommand from '../ui/AnnotationCommand'
import setupEditor from './fixture/setupEditor'
import containerAnnoSample from './fixture/containerAnnoSample'

const test = module('AnnotationCommand')

test("can 'create' property annotation", function(t) {
  let { doc } = fixture(t)
  let selectionState = new SelectionState(doc)
  let cmd = new ToggleStrongCommand()
  let sel = doc.createSelection({
    type: 'property',
    path: ['p4', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  selectionState.setSelection(sel)
  let cmdState = cmd.getCommandState({
    selectionState: selectionState
  })
  t.equal(cmdState.mode, 'create', "Mode should be correct.")
  t.end()
})

test("execute 'create' property annotation", function(t) {
  let { editorSession, doc } = fixture(t)
  let cmd = new ToggleStrongCommand()
  editorSession.setSelection({
    type: 'property',
    path: ['p4', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  let res = cmd.execute({
    commandState: {
      mode: 'create'
    },
    editorSession: editorSession,
    selectionState: editorSession.getSelectionState()
  })
  let newAnno = res.anno
  t.notNil(newAnno, 'A new anno should have been created')
  newAnno = doc.get(newAnno.id)
  t.equal(newAnno.type, 'strong', '.. of correct type')
  t.deepEqual(newAnno.start.path, ['p4', 'content'], ".. with correct path")
  t.equal(newAnno.start.offset, 1, '.. with correct startOffset')
  t.equal(newAnno.end.offset, 6, '.. with correct endOffset')
  t.end()
})

test("can 'delete' property annotation", function(t) {
  let { doc } = fixture(t)
  let selectionState = new SelectionState(doc)
  let cmd = new ToggleStrongCommand()
  let sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    endOffset: 7
  })
  selectionState.setSelection(sel)
  let cmdState = cmd.getCommandState({
    selectionState: selectionState
  })
  t.equal(cmdState.mode, 'delete', "Mode should be correct.")
  t.end()
})

test("execute 'delete' property annotation", function(t) {
  let { doc } = fixture(t)
  let selectionState = new SelectionState(doc)
  let cmd = new ToggleStrongCommand()
  let sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    endOffset: 7
  })
  selectionState.setSelection(sel)
  let cmdState = cmd.getCommandState({
    selectionState: selectionState
  })
  t.equal(cmdState.mode, 'delete', "Mode should be correct.")
  t.end()
})

test("can 'expand' property annotation", function(t) {
  let { editorSession, doc } = fixture(t)
  let cmd = new ToggleStrongCommand()
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    endOffset: 7
  })
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

class ToggleStrongCommand extends AnnotationCommand {
  constructor() {
    super({ name: 'strong', nodeType: 'strong' })
  }
}

function fixture(t) {
  return setupEditor(t, containerAnnoSample, (tx) => {
    tx.create({
      id: 'a3',
      type: 'strong',
      start: { path: ['p1', 'content'], offset: 4 },
      end: { offset: 8 }
    })
  })
}

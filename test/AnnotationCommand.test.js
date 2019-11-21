import { test } from 'substance-test'
import { AnnotationCommand } from 'substance'
import setupEditor from './shared/setupEditor'
import containerAnnoSample from './fixture/containerAnnoSample'
import simple from './fixture/simple'

test("AnnotationCommand: can 'create' property annotation", (t) => {
  const { editorSession } = setupEditor(t, _default)
  const cmd = new ToggleStrongCommand()
  editorSession.setSelection({
    type: 'property',
    path: ['p4', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  const cmdState = cmd.getCommandState(_getCommandParams(editorSession))
  t.equal(cmdState.mode, 'create', 'Mode should be correct.')
  t.end()
})

test("AnnotationCommand: execute 'create' property annotation", (t) => {
  const { editorSession, doc } = setupEditor(t, _default)
  const cmd = new ToggleStrongCommand()
  editorSession.setSelection({
    type: 'property',
    path: ['p4', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  const params = _getCommandParams(editorSession)
  params.commandState = { mode: 'create' }
  const res = cmd.execute(params)
  let newAnno = res.anno
  t.notNil(newAnno, 'A new anno should have been created')
  newAnno = doc.get(newAnno.id)
  t.equal(newAnno.type, 'strong', '.. of correct type')
  t.deepEqual(newAnno.start.path, ['p4', 'content'], '.. with correct path')
  t.equal(newAnno.start.offset, 1, '.. with correct startOffset')
  t.equal(newAnno.end.offset, 6, '.. with correct endOffset')
  t.end()
})

test("AnnotationCommand: can 'delete' property annotation", (t) => {
  const { editorSession } = setupEditor(t, _default)
  const cmd = new ToggleStrongCommand()
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    endOffset: 7
  })
  const cmdState = cmd.getCommandState(_getCommandParams(editorSession))
  t.equal(cmdState.mode, 'delete', 'Mode should be correct.')
  t.end()
})

test("AnnotationCommand: execute 'delete' property annotation", (t) => {
  const { doc, editorSession } = setupEditor(t, _default)
  const cmd = new ToggleStrongCommand()
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    endOffset: 7
  })
  const params = _getCommandParams(editorSession)
  params.commandState = { mode: 'delete' }
  cmd.execute(params)
  t.isNil(doc.get('a3'), 'annotation should have been deleted')
  t.end()
})

test('AnnotationCommand: creating two consecutive annotations', (t) => {
  const { editorSession, doc } = setupEditor(t, simple)
  const cmd = new ToggleStrongCommand()
  editorSession.transaction(tx => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 0,
      endOffset: 3
    })
    tx.annotate({ type: 'strong' })
  })
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    endOffset: 6
  })
  const params = _getCommandParams(editorSession)
  const cmdState = cmd.getCommandState(params)
  t.equal(cmdState.mode, 'create', 'Should allow to create.')
  params.commandState = cmdState
  cmd.execute(params)
  const p1 = doc.get('p1')
  const annos = p1.getAnnotations()
  t.equal(annos.length, 2, 'there should be two annotations')
  t.end()
})

test('AnnotationCommand: expanding an annotation', (t) => {
  const { editorSession, doc } = setupEditor(t, simple)
  const cmd = new ToggleStrongCommand()
  editorSession.transaction(tx => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 0,
      endOffset: 3
    })
    tx.annotate({ type: 'strong' })
  })
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 2,
    endOffset: 6
  })
  const params = _getCommandParams(editorSession)
  const cmdState = cmd.getCommandState(params)
  t.equal(cmdState.mode, 'expand', 'command should be expand.')
  params.commandState = cmdState
  cmd.execute(params)
  const p1 = doc.get('p1')
  const annos = p1.getAnnotations()
  t.equal(annos.length, 1, 'there should be one annotation')
  const anno = annos[0]
  t.deepEqual([anno.start.offset, anno.end.offset], [0, 6], 'annotation should have been expanded')
  t.end()
})

class ToggleStrongCommand extends AnnotationCommand {
  constructor () {
    super({ name: 'strong', nodeType: 'strong' })
  }
}

function _default (tx) {
  containerAnnoSample(tx)
  tx.create({
    id: 'a3',
    type: 'strong',
    start: { path: ['p1', 'content'], offset: 4 },
    end: { offset: 8 }
  })
}

function _getCommandParams (editorSession) {
  return {
    editorSession,
    selection: editorSession.getSelection(),
    selectionState: editorSession.getSelectionState()
  }
}

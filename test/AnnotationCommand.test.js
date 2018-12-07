import { test } from 'substance-test'
import { AnnotationCommand } from 'substance'
import setupEditor from './fixture/setupEditor'
import containerAnnoSample from './fixture/containerAnnoSample'
import simple from './fixture/simple'

test("AnnotationCommand: can 'create' property annotation", (t) => {
  let { editorSession } = setupEditor(t, _default)
  let cmd = new ToggleStrongCommand()
  editorSession.setSelection({
    type: 'property',
    path: ['p4', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  let cmdState = cmd.getCommandState(_getCommandParams(editorSession))
  t.equal(cmdState.mode, 'create', 'Mode should be correct.')
  t.end()
})

test("AnnotationCommand: execute 'create' property annotation", (t) => {
  let { editorSession, doc } = setupEditor(t, _default)
  let cmd = new ToggleStrongCommand()
  editorSession.setSelection({
    type: 'property',
    path: ['p4', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  let params = _getCommandParams(editorSession)
  params.commandState = { mode: 'create' }
  let res = cmd.execute(params)
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
  let { editorSession } = setupEditor(t, _default)
  let cmd = new ToggleStrongCommand()
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    endOffset: 7
  })
  let cmdState = cmd.getCommandState(_getCommandParams(editorSession))
  t.equal(cmdState.mode, 'delete', 'Mode should be correct.')
  t.end()
})

test("AnnotationCommand: execute 'delete' property annotation", (t) => {
  let { doc, editorSession } = setupEditor(t, _default)
  let cmd = new ToggleStrongCommand()
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    endOffset: 7
  })
  let params = _getCommandParams(editorSession)
  params.commandState = { mode: 'delete' }
  cmd.execute(params)
  t.isNil(doc.get('a3'), 'annotation should have been deleted')
  t.end()
})

test('AnnotationCommand: creating two consecutive annotations', (t) => {
  let { editorSession, doc } = setupEditor(t, simple)
  let cmd = new ToggleStrongCommand()
  editorSession.transaction(tx => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 0,
      endOffset: 3
    })
    tx.annotate({type: 'strong'})
  })
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    endOffset: 6
  })
  let params = _getCommandParams(editorSession)
  let cmdState = cmd.getCommandState(params)
  t.equal(cmdState.mode, 'create', 'Should allow to create.')
  params.commandState = cmdState
  cmd.execute(params)
  let p1 = doc.get('p1')
  let annos = p1.getAnnotations()
  t.equal(annos.length, 2, 'there should be two annotations')
  t.end()
})

test('AnnotationCommand: expanding an annotation', (t) => {
  let { editorSession, doc } = setupEditor(t, simple)
  let cmd = new ToggleStrongCommand()
  editorSession.transaction(tx => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 0,
      endOffset: 3
    })
    tx.annotate({type: 'strong'})
  })
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 2,
    endOffset: 6
  })
  let params = _getCommandParams(editorSession)
  let cmdState = cmd.getCommandState(params)
  t.equal(cmdState.mode, 'expand', 'command should be expand.')
  params.commandState = cmdState
  cmd.execute(params)
  let p1 = doc.get('p1')
  let annos = p1.getAnnotations()
  t.equal(annos.length, 1, 'there should be one annotation')
  let anno = annos[0]
  t.deepEqual([anno.startOffset, anno.endOffset], [0, 6], 'annotation should have been expanded')
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

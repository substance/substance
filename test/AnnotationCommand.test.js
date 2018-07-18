import { module } from 'substance-test'
import { AnnotationCommand } from 'substance'
import setupEditor from './fixture/setupEditor'
import containerAnnoSample from './fixture/containerAnnoSample'

const test = module('AnnotationCommand')

test("can 'create' property annotation", (t) => {
  let { editorSession } = fixture(t)
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

test("execute 'create' property annotation", (t) => {
  let { editorSession, doc } = fixture(t)
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

test("can 'delete' property annotation", (t) => {
  let { editorSession } = fixture(t)
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

test("execute 'delete' property annotation", (t) => {
  let { doc, editorSession } = fixture(t)
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

class ToggleStrongCommand extends AnnotationCommand {
  constructor () {
    super({ name: 'strong', nodeType: 'strong' })
  }
}

function fixture (t) {
  return setupEditor(t, containerAnnoSample, (tx) => {
    tx.create({
      id: 'a3',
      type: 'strong',
      start: { path: ['p1', 'content'], offset: 4 },
      end: { offset: 8 }
    })
  })
}

function _getCommandParams (editorSession) {
  return {
    editorSession,
    selection: editorSession.getSelection(),
    selectionState: editorSession.getSelectionState()
  }
}

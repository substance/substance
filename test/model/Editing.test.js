import { module } from 'substance-test'

import EditorSession from '../../model/EditorSession'
import AbstractEditor from '../../ui/AbstractEditor'
import ContainerEditor from '../../ui/ContainerEditor'
import Configurator from '../../util/Configurator'
import ParagraphPackage from '../../packages/paragraph/ParagraphPackage'
import StrongPackage from '../../packages/strong/StrongPackage'
import createTestArticle from '../fixtures/createTestArticle'

const test = module('model/Editing')

test.UI("[IT1]: Cursor within a TextProperty", function(t) {
  let editor = TestEditor.mount({ editorSession: fixture(_p1) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 3
    })
    tx.insertText('xxx')
  })
  let p1 = doc.get('p1')
  t.equal(p1.getText(), 'abcxxxdef', 'Text should have been inserted correctly.')
  t.end()
})

test.UI("[IT2]: Cursor within TextProperty inside annotation", function(t) {
  let editor = TestEditor.mount({ editorSession: fixture(_p1, _s1) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 4
    })
    tx.insertText('xxx')
  })
  let p1 = doc.get('p1')
  let s1 = doc.get('s1')
  t.equal(p1.getText(), 'abcdxxxef', 'Text should have been inserted correctly.')
  t.equal(s1.endOffset, 8, 'Annotation should have been expanded.')
  t.end()
})


class TestEditor extends AbstractEditor {
  render($$) {
    let doc = this.editorSession.getDocument()
    let el = $$('div')
    let body = $$(ContainerEditor, {
      node: doc.get('body')
    })
    el.append(body)
    return el
  }
}

function createSession(doc) {
  let config = new Configurator()
  config.addToolGroup('annotations')
  config.import(ParagraphPackage)
  config.import(StrongPackage)
  return new EditorSession(doc, { configurator: config })
}

function fixture(...args) {
  let doc = createTestArticle((doc) => {
    let body = doc.get('body')
    args.forEach((seed)=>{
      seed(doc, body)
    })
  })
  let editorSession = createSession(doc)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    containerId: 'body',
    surfaceId: 'body'
  })
  return editorSession
}

function _p1(doc, body) {
  doc.create({
    type: 'paragraph',
    id: 'p1',
    content: 'abcdef'
  })
  body.show('p1')
}

function _s1(doc) {
  doc.create({
    type: 'strong',
    id: 's1',
    path: ['p1', 'content'],
    startOffset: 3,
    endOffset: 5
  })
}

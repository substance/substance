import { module } from 'substance-test'

import Document from '../../model/Document'
import EditorSession from '../../model/EditorSession'
import BlockNode from '../../model/BlockNode'
import InlineNode from '../../model/InlineNode'
import AbstractEditor from '../../ui/AbstractEditor'
import Component from '../../ui/Component'
import ContainerEditor from '../../ui/ContainerEditor'
import Configurator from '../../util/Configurator'
import ParagraphPackage from '../../packages/paragraph/ParagraphPackage'
import StrongPackage from '../../packages/strong/StrongPackage'

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
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  t.equal(p1.getText(), 'abcxxxdef', 'Text should have been inserted correctly.')
  t.equal(sel.startOffset, 6, 'Cursor should be after inserted text')
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
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  let s1 = doc.get('s1')
  t.equal(p1.getText(), 'abcdxxxef', 'Text should have been inserted correctly.')
  t.equal(s1.endOffset, 8, 'Annotation should have been expanded.')
  t.equal(sel.startOffset, 7, 'Cursor should be after inserted text')
  t.end()
})

test.UI("[IT3]: Cursor within TextProperty at the start of an annotation", function(t) {
  let editor = TestEditor.mount({ editorSession: fixture(_p1, _s1) }, t.sandbox)
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
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  let s1 = doc.get('s1')
  t.equal(p1.getText(), 'abcxxxdef', 'Text should have been inserted correctly.')
  t.equal(s1.startOffset, 6, 'Annotation should have been moved.')
  t.equal(s1.endOffset, 8, 'Annotation should have been moved.')
  t.equal(sel.startOffset, 6, 'Cursor should be after inserted text')
  t.end()
})

test.UI("[II1]: Insert inline node into TextProperty", function(t) {
  let editor = TestEditor.mount({ editorSession: fixture(_p1) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 3
    })
    tx.insertInlineNode({
      type: 'test-inline',
      id: 'il1',
      foo: 'foo'
    })
  })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  let il1 = doc.get('il1')
  t.equal(p1.getText(), 'abc\uFEFFdef', 'Text should have been inserted correctly.')
  t.equal(il1.startOffset, 3, 'Annotation should have been moved.')
  t.equal(il1.endOffset, 4, 'Annotation should have been moved.')
  t.equal(sel.startOffset, 4, 'Cursor should be after inserted inline node')
  t.end()
})

test.UI("[IB2]: Cursor at start of a TextNode within a Container", function(t) {
  let editor = TestEditor.mount({ editorSession: fixture(_p1) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 0
    })
    tx.insertBlockNode({
      type: 'test-block',
      id: 'ib1'
    })
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes[0], 'ib1', 'First node should be inserted block node.')
  t.equal(body.nodes[1], 'p1', 'Second node should be inserted block node.')
  t.deepEqual(sel.startPath, ['p1', 'content'], 'Cursor should be in paragraph')
  t.ok(sel.isCollapsed(), '...collapsed')
  t.equal(sel.startOffset, 0, '... offset 0')
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

function getConfig() {
  let config = new Configurator()
  config.addToolGroup('annotations')
  config.defineSchema({ name: 'test-article' })
  config.import(ParagraphPackage)
  config.import(StrongPackage)
  config.addNode(TestBlockNode)
  config.addNode(TestInlineNode)
  config.addComponent('test-block', Component)
  return config
}

function fixture(...args) {
  let config = getConfig()
  let doc = new Document(config.getSchema())
  let body = doc.create({
    type: 'container',
    id: 'body'
  })
  args.forEach((seed)=>{
    seed(doc, body)
  })
  let editorSession = new EditorSession(doc, { configurator: config })
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

class TestInlineNode extends InlineNode {}
TestInlineNode.type = 'test-inline'
TestInlineNode.define({
  foo: { type: 'string' }
})

class TestBlockNode extends BlockNode {}
TestBlockNode.type = 'test-block'

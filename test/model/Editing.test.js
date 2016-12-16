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
import ListPackage from '../../packages/list/ListPackage'

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
  t.equal(sel.start.offset, 6, 'Cursor should be after inserted text')
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
  t.equal(s1.end.offset, 8, 'Annotation should have been expanded.')
  t.equal(sel.start.offset, 7, 'Cursor should be after inserted text')
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
  t.equal(s1.start.offset, 6, 'Annotation should have been moved.')
  t.equal(s1.end.offset, 8, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 6, 'Cursor should be after inserted text')
  t.end()
})

test.UI("[IT4]: Cursor within TextProperty at the end of an annotation", function(t) {
  let editor = TestEditor.mount({ editorSession: fixture(_p1, _s1) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 5
    })
    tx.insertText('xxx')
  })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  let s1 = doc.get('s1')
  t.equal(p1.getText(), 'abcdexxxf', 'Text should have been inserted correctly.')
  t.equal(s1.start.offset, 3, 'Annotation should have been moved.')
  t.equal(s1.end.offset, 8, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 8, 'Cursor should be after inserted text')
  t.end()
})

test.UI("[IT5]: Range within TextProperty", function(t) {
  let editor = TestEditor.mount({ editorSession: fixture(_p1) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 2,
      endOffset: 5
    })
    tx.insertText('xxx')
  })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  t.equal(p1.getText(), 'abxxxf', 'Text should have been inserted correctly.')
  t.equal(sel.start.offset, 5, 'Cursor should be after inserted text')
  t.ok(sel.isCollapsed(), '... collapsed')
  t.end()
})

test.UI("[IT6]: Range within TextProperty overlapping an annotion aligned at the left side", function(t) {
  let editor = TestEditor.mount({ editorSession: fixture(_p1, _s1) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  doc.set(['s1', 'end', 'offset'], 6)
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 3,
      endOffset: 5
    })
    tx.insertText('xxx')
  })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  let s1 = doc.get('s1')
  t.equal(p1.getText(), 'abcxxxf', 'Text should have been inserted correctly.')
  t.equal(s1.start.offset, 3, 'Annotation should have been moved.')
  t.equal(s1.end.offset, 7, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 6, 'Cursor should be after inserted text')
  t.ok(sel.isCollapsed(), '... collapsed')
  t.end()
})

test.UI("[IT7]: Range within TextProperty inside an annotion", function(t) {
  let editor = TestEditor.mount({ editorSession: fixture(_p1, _s1) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 3,
      endOffset: 5
    })
    tx.insertText('xxx')
  })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  let s1 = doc.get('s1')
  t.equal(p1.getText(), 'abcxxxf', 'Text should have been inserted correctly.')
  t.equal(s1.start.offset, 3, 'Annotation should have been moved.')
  t.equal(s1.end.offset, 6, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 6, 'Cursor should be after inserted text')
  t.ok(sel.isCollapsed(), '... collapsed')
  t.end()
})

test.UI("[IT8]: Range within TextProperty starting inside an annotion", function(t) {
  let editor = TestEditor.mount({ editorSession: fixture(_p1, _s1) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  doc.set(['s1', 'end', 'offset'], 6)
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset:4,
      endOffset: 6
    })
    tx.insertText('xxx')
  })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  let s1 = doc.get('s1')
  t.equal(p1.getText(), 'abcdxxx', 'Text should have been inserted correctly.')
  t.equal(s1.start.offset, 3, 'Annotation should have been moved.')
  t.equal(s1.end.offset, 7, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 7, 'Cursor should be after inserted text')
  t.ok(sel.isCollapsed(), '... collapsed')
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
  t.equal(il1.start.offset, 3, 'Annotation should have been moved.')
  t.equal(il1.end.offset, 4, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 4, 'Cursor should be after inserted inline node')
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
  t.deepEqual(sel.start.path, ['p1', 'content'], 'Cursor should be in paragraph')
  t.ok(sel.isCollapsed(), '...collapsed')
  t.equal(sel.start.offset, 0, '... offset 0')
  t.end()
})

// TODO: add specification
test.UI("[L1]: Insert text into list item", function(t) {
  let editor = TestEditor.mount({ editorSession: fixture(_l1) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['l1', 'items', 'l1-1', 'content'],
      startOffset: 3
    })
    tx.insertText('xxx')
  })
  let sel = editorSession.getSelection()
  let li = doc.get('l1-1')
  t.equal(li.getText(), 'abcxxxdef', 'Text should have been inserted correctly.')
  t.equal(sel.startOffset, 6, 'Cursor should be after inserted text')
  t.end()
})

test.UI("[L2]: Break list item (in the middle of text)", function(t) {
  let editor = TestEditor.mount({ editorSession: fixture(_l1) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['l1', 'items', 'l1-1', 'content'],
      startOffset: 3
    })
    tx.break()
  })
  let sel = editorSession.getSelection()
  let l = doc.get('l1')
  t.equal(l.items.length, 3, 'List should have 3 items')
  let li1 = doc.get(l.items[0])
  let li2 = doc.get(l.items[1])
  t.equal(li1.getText(), 'abc', 'First item should have been truncated.')
  t.equal(li2.getText(), 'def', 'remaining line should have been inserted into new list item.')
  t.equal(sel.start.path, l.getItemPath(li2.id), 'Cursor should in second item')
  t.equal(sel.start.offset, 0, 'Cursor should be at begin of item.')
  t.end()
})

// TODO: add specification and test cases for tx.annotate()

// test("Create property annotation for a given property selection", function(t) {
//   var doc = fixture(headersAndParagraphs)

//   // Selected text 'Paragraph' in p1
//   var sel = doc.createSelection({
//     type: 'property',
//     path: ['p1', 'content'],
//     startOffset: 0,
//     endOffset: 9
//   })

//   // Prepare and perform transformation
//   var args = {selection: sel, containerId: 'body', node: {type: 'strong'}}
//   var out = createAnnotation(doc, args)

//   var anno = out.result
//   t.ok(anno, 'A new annotation should be present')
//   t.equal(anno.type, 'strong', 'Anno type should be strong')

//   var annoText = out.result.getText()
//   var selText = docHelpers.getTextForSelection(doc, sel)
//   t.equal(annoText, selText, 'New annotation should have the same text as the original selection')
//   t.end()
// })

// test("Create container annotation for a given container selection", function(t) {
//   var doc = fixture(headersAndParagraphs)

//   // Selected text 'Paragraph' in p1
//   var sel = doc.createSelection({
//     type: 'container',
//     containerId: 'body',
//     startPath: ['p1', 'content'],
//     startOffset: 5,
//     endPath: ['h2', 'content'],
//     endOffset: 4,
//   })

//   // Prepare and perform transformation
//   var args = {selection: sel, containerId: 'body', node: {type: 'test-container-anno'}}
//   var out = createAnnotation(doc, args)

//   var anno = out.result
//   t.ok(anno, 'A new annotation should be present')
//   t.equal(anno.type, 'test-container-anno', 'Anno type should be strong')

//   var annoText = out.result.getText()
//   var selText = docHelpers.getTextForSelection(doc, sel)
//   t.equal(annoText, selText, 'New annotation should have the same text as the original selection')
//   t.end()
// })

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
  config.import(ListPackage)
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
    start: {
      path: ['p1', 'content'],
      offset: 3,
    },
    end: {
      offset: 5
    }
  })
}

// list with two items
function _l1(doc, body) {
  doc.create({
    type: 'list-item',
    id: 'l1-1',
    content: 'abcdef'
  })
  doc.create({
    type: 'list-item',
    id: 'l1-2',
    content: 'abcdef'
  })
  doc.create({
    type: 'list',
    id: 'l1',
    items: ['l1-1', 'l1-2']
  })
  body.show('l1')
}

class TestInlineNode extends InlineNode {}
TestInlineNode.type = 'test-inline'
TestInlineNode.schema = {
  foo: { type: 'string' }
}

class TestBlockNode extends BlockNode {}
TestBlockNode.type = 'test-block'

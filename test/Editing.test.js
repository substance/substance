/* eslint-disable no-use-before-define */
import { module } from 'substance-test'

import Document from '../model/Document'
import DocumentSchema from '../model/DocumentSchema'
import EditorSession from '../model/EditorSession'
import BlockNode from '../model/BlockNode'
import InlineNode from '../model/InlineNode'
import AbstractEditor from '../ui/AbstractEditor'
import Component from '../ui/Component'
import ContainerEditor from '../ui/ContainerEditor'
import Configurator from '../util/Configurator'
import ParagraphPackage from '../packages/paragraph/ParagraphPackage'
import StrongPackage from '../packages/strong/StrongPackage'
import ListPackage from '../packages/list/ListPackage'

const test = module('Editing')

// TODO: consolidate specification and 'category labels' of tests

// TODO: we should enable t.sandbox for all tests so that this implementation is
// tested on all platforms

test.UI("[IT1]: Inserting text with cursor in the middle of a TextProperty", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1)
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
  t.equal(p1.getText(), P1_TEXT.slice(0,3)+'xxx'+P1_TEXT.slice(3), 'Text should have been inserted correctly.')
  t.equal(sel.start.offset, 6, 'Cursor should be after inserted text')
  t.end()
})

test.UI("[IT2]: Inserting text with cursor within TextProperty inside annotation", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
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
  t.equal(p1.getText(), P1_TEXT.slice(0,4)+'xxx'+P1_TEXT.slice(4), 'Text should have been inserted correctly.')
  t.equal(s1.end.offset, 8, 'Annotation should have been expanded.')
  t.equal(sel.start.offset, 7, 'Cursor should be after inserted text')
  t.end()
})

test.UI("[IT3]: Inserting text with cursor within TextProperty at the start of an annotation", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
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
  t.equal(p1.getText(), P1_TEXT.slice(0,3)+'xxx'+P1_TEXT.slice(3), 'Text should have been inserted correctly.')
  t.equal(s1.start.offset, 6, 'Annotation should have been moved.')
  t.equal(s1.end.offset, 8, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 6, 'Cursor should be after inserted text')
  t.end()
})

test.UI("[IT4]: Inserting text with cursor within TextProperty at the end of an annotation", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
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
  t.equal(p1.getText(), P1_TEXT.slice(0,5)+'xxx'+P1_TEXT.slice(5), 'Text should have been inserted correctly.')
  t.equal(s1.start.offset, 3, 'Annotation should have been moved.')
  t.equal(s1.end.offset, 8, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 8, 'Cursor should be after inserted text')
  t.end()
})

test.UI("[IT5]: Inserting text with range within TextProperty", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1)
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
  t.equal(p1.getText(), P1_TEXT.slice(0, 2)+'xxx'+P1_TEXT.slice(5), 'Text should have been inserted correctly.')
  t.equal(sel.start.offset, 5, 'Cursor should be after inserted text')
  t.ok(sel.isCollapsed(), '... collapsed')
  t.end()
})

test.UI("[IT6]: Inserting text with range within TextProperty overlapping an annotion aligned at the left side", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
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
  t.equal(p1.getText(), P1_TEXT.slice(0, 3)+'xxx'+P1_TEXT.slice(5), 'Text should have been inserted correctly.')
  t.equal(s1.start.offset, 3, 'Annotation should have been moved.')
  t.equal(s1.end.offset, 7, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 6, 'Cursor should be after inserted text')
  t.ok(sel.isCollapsed(), '... collapsed')
  t.end()
})

test.UI("[IT7]: Inserting text with range within TextProperty inside an annotion", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
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
  t.equal(p1.getText(), P1_TEXT.slice(0, 3)+'xxx'+P1_TEXT.slice(5), 'Text should have been inserted correctly.')
  t.equal(s1.start.offset, 3, 'Annotation should have been moved.')
  t.equal(s1.end.offset, 6, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 6, 'Cursor should be after inserted text')
  t.ok(sel.isCollapsed(), '... collapsed')
  t.end()
})

test.UI("[IT8]: Inserting text with range within TextProperty starting inside an annotion", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
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
  t.equal(p1.getText(), P1_TEXT.slice(0, 4)+'xxx'+P1_TEXT.slice(6), 'Text should have been inserted correctly.')
  t.equal(s1.start.offset, 3, 'Annotation should have been moved.')
  t.equal(s1.end.offset, 7, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 7, 'Cursor should be after inserted text')
  t.ok(sel.isCollapsed(), '... collapsed')
  t.end()
})

test.UI("[II1]: Inserting InlineNode node into a TextProperty", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1)
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
  t.equal(p1.getText(), P1_TEXT.slice(0,3)+'\uFEFF'+P1_TEXT.slice(3), 'Text should have been inserted correctly.')
  t.equal(il1.start.offset, 3, 'Annotation should have been moved.')
  t.equal(il1.end.offset, 4, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 4, 'Cursor should be after inserted inline node')
  t.end()
})

test.UI("[IB2]: Inserting BlockNode using cursor at start of a TextNode", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1)
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
  let p1 = doc.get('p1')
  t.equal(body.nodes[0], 'ib1', 'First node should be inserted block node.')
  t.equal(body.nodes[1], 'p1', 'Second node should be inserted block node.')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, p1.getTextPath(), '... on paragraph')
  t.equal(sel.start.offset, 0, '... first position')
  t.end()
})

test.UI("[DR2]: Deleting using DELETE with cursor at the end of a TextNode at the end of a Container", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: P2_TEXT.length,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('right')
  })
  // nothing should have happened
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes.length, 2, 'There should still be 2 nodes in body')
  let p2 = doc.get('p2')
  t.equal(p2.getText(), P2_TEXT, 'p2 should still have same content.')
  t.equal(sel.start.offset, P2_TEXT.length, 'Cursor should still be at the same position')
  t.end()
})

test.UI("[DR3]: Deleting using DELETE with cursor in the middle of a TextProperty", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1)
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['p1', 'content'],
      startOffset: 3
    })
    tx.deleteCharacter('right')
  })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  t.equal(p1.getText(), P1_TEXT.slice(0,3)+P1_TEXT.slice(4), 'One character should have been deleted')
  t.equal(sel.start.offset, 3, 'Cursor should be at the same position')
  t.end()
})

test.UI("[DR4-1]: Deleting using DELETE with cursor inside an empty TextNode and TextNode as successor", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _empty, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['empty', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('right')
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  let p2 = doc.get('p2')
  t.equal(body.nodes.length, 2, 'There should be only 2 nodes left.')
  t.equal(p2.getText(), P2_TEXT, 'p2 should not be affected')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, p2.getTextPath(), '... on p2')
  t.equal(sel.start.offset, 0, '... at first position')
  t.end()
})

test.UI("[DR4-2]: Deleting using DELETE with cursor inside an empty TextNode and IsolatedNode as successor", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _empty, _block1)
  editorSession.setSelection({
    type: 'property',
    path: ['empty', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('right')
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes.length, 2, 'There should be only 2 nodes left.')
  t.ok(sel.isNodeSelection(), 'Selection should be a NodeSelection')
  t.ok(sel.isBefore(), '... before')
  t.equal(sel.getNodeId(), 'block1', '... block1')
  t.end()
})

test.UI("[DR4-3]: Deleting using DELETE with cursor inside an empty TextNode and List as successor", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _empty, _l1)
  editorSession.setSelection({
    type: 'property',
    path: ['empty', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('right')
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  let l = doc.get('l1')
  t.equal(body.nodes.length, 2, 'There should be only 2 nodes left.')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, l.getItemPath('l1-1'), '... on first list item')
  t.equal(sel.start.offset, 0,'... at first position')
  t.end()
})

test.UI("[DR5-1]: Deleting using DELETE with cursor at the end of a non-empty TextNode and TextNode as successor", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: P1_TEXT.length,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('right')
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  let p1 = doc.get('p1')
  t.equal(body.nodes.length, 1, 'There should be only one node left.')
  t.ok(sel.isCollapsed(), 'Selection should be a collapsed')
  t.deepEqual(sel.start.path, p1.getTextPath(), '... on p1')
  t.equal(sel.start.offset, P1_TEXT.length, '... at the same position as before')
  t.end()
})

test.UI("[DR5-2]: Deleting using DELETE with cursor at the end of a non-empty TextNode and IsolatedNode as successor", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _block1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: P1_TEXT.length,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('right')
  })
  // NOTE: if there is no merge possible, nothing should happen
  // only the selection should be updated
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes.length, 2, 'There should still be 2 nodes left.')
  t.ok(sel.isNodeSelection(), 'Selection should be a NodeSelection')
  t.equal(sel.getNodeId(), 'block1', '... in block1')
  t.ok(sel.isFull(), '... selecting the whole node')
  t.end()
})

// TODO: test DR5 with list as successor

test.UI("[DR11]: Deleting using DELETE with cursor before IsolatedNode", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _block1, _p2)
  editorSession.setSelection({
    type: 'node',
    mode: 'before',
    nodeId: 'block1',
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('right')
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes.length, 3, 'There should be 3 nodes.')
  let pnew = body.getChildAt(1)
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, pnew.getTextPath(), '... on new paragraph')
  t.equal(sel.start.offset, 0, '... at first position')
  t.end()
})

test.UI("[DR16]: Deleting using DELETE with cursor after IsolatedNode and TextNode as successor", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _block1, _p2)
  editorSession.setSelection({
    type: 'node',
    mode: 'after',
    nodeId: 'block1',
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('right')
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  let p2 = doc.get('p2')
  t.equal(body.nodes.length, 3, 'There should still be 3 nodes.')
  t.equal(p2.getText(), P2_TEXT.slice(1), 'First character of p2 should be deleted')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, p2.getTextPath(), '... on p2')
  t.equal(sel.start.offset, 0, '... at first position')
  t.end()
})


test.UI("[DL3]: Deleting using BACKSPACE with cursor in the middle of a TextProperty", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('left')
  })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  t.equal(p1.getText(), P1_TEXT.slice(0,3)+P1_TEXT.slice(4), 'one character should have been deleted')
  t.equal(sel.start.offset, 3, 'Cursor should have shifted by one character')
  t.end()
})

test.UI("[DL4-1]: Deleting using BACKSPACE with cursor inside an empty TextNode and TextNode as predecessor", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _empty, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['empty', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('left')
  })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  t.isNil(doc.get('empty'), 'empty node should have been deleted')
  t.equal(p1.getText(), P1_TEXT, 'p1 should be untouched')
  t.deepEqual(sel.start.path, p1.getTextPath(), 'Cursor should be in p1')
  t.equal(sel.start.offset, P1_TEXT.length, '... at last position')
  t.end()
})

test.UI("[DL4-2]: Deleting using BACKSPACE with cursor inside an empty TextNode and IsolatedNode as predecessor", function(t) {
  let { editorSession, doc } = setupEditor(t, _block1, _empty, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['empty', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('left')
  })
  let sel = editorSession.getSelection()
  t.isNil(doc.get('empty'), 'empty node should have been deleted')
  t.ok(sel.isNodeSelection(), 'Selection should be a node selection')
  t.equal(sel.getNodeId(), 'block1', '... on block1')
  t.ok(sel.isAfter(), '... cursor after the node')
  t.end()
})

// TODO: DL4 with List as predecessor

test.UI("[DL5-1]: Deleting using BACKSPACE with cursor at the start of a non-empty TextNode and TextNode as predecessor", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('left')
  })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  t.isNil(doc.get('p2'), 'p2 should have been deleted')
  t.equal(p1.getText(), P1_TEXT+P2_TEXT, 'Text should have been merged')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, p1.getTextPath(), '... on p1')
  t.ok(sel.start.offset, P1_TEXT.length, '... cursor should after the original text of p1')
  t.end()
})

test.UI("[DL5-2]: Deleting using BACKSPACE with cursor at the start of a non-empty TextNode and IsolatedNode as predecessor", function(t) {
  let { editorSession, doc } = setupEditor(t, _block1, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('left')
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.getLength(), 2, 'There should still be two nodes')
  t.ok(sel.isNodeSelection(), 'Selection should be a NodeSelection')
  t.equal(sel.getNodeId(), 'block1', '... on block1')
  t.ok(sel.isFull(), '... selecting the full node')
  t.end()
})

test.UI("[DL13]: Deleting using BACKSPACE with cursor after IsolatedNode", function(t) {
  let { editorSession, doc } = setupEditor(t, _block1, _p2)
  editorSession.setSelection({
    type: 'node',
    mode: 'after',
    nodeId: 'block1',
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('left')
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.isNil(doc.get('block1'), 'IsolatedNode should have been deleted')
  t.equal(body.getLength(), 2, 'There should still be two nodes')
  let pnew = body.getChildAt(0)
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, pnew.getTextPath(), '... on new paragraph')
  t.equal(sel.start.offset, 0, '... at first position')
  t.end()
})

test.UI("[DL16]: Deleting using BACKSPACE with cursor before IsolatedNode with TextNode as predecessor", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _block2)
  editorSession.setSelection({
    type: 'node',
    mode: 'before',
    nodeId: 'block2',
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('left')
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  let p1 = doc.get('p1')
  t.equal(body.getLength(), 2, 'There should still be two nodes')
  t.equal(p1.getText(), P1_TEXT.slice(0, -1), 'Last character of p1 should have been deleted')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, p1.getTextPath(), '... on p1')
  t.equal(sel.start.offset, P1_TEXT.length-1, '... at last position')
  t.end()
})

test.UI("[DL17]: Deleting using BACKSPACE with cursor before IsolatedNode and IsolatedNode as predecessor", function(t) {
  let { editorSession, doc } = setupEditor(t, _block1, _block2)
  editorSession.setSelection({
    type: 'node',
    mode: 'before',
    nodeId: 'block2',
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('left')
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.getLength(), 2, 'There should still be two nodes')
  t.ok(sel.isNodeSelection(), 'Selection should be a NodeSelection')
  t.equal(sel.getNodeId(), 'block1', '... on block1')
  t.ok(sel.isFull(), '... selection the entire node')
  t.end()
})

test.UI("[D10]: Deleting an entirely selected IsolatedNode", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _block1, _p2)
  editorSession.setSelection({
    type: 'node',
    mode: 'full',
    nodeId: 'block1',
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.isNil(doc.get('block1'), 'IsolatedNode should have been deleted')
  let pnew = body.getChildAt(1)
  t.equal(body.getLength(), 3, 'There should be 3 nodes')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, pnew.getTextPath(), '... on new paragraph')
  t.equal(sel.start.offset, 0, '... at first position')
  t.end()
})

test.UI("[D20-1]: Deleting a range starting before a TextNode and ending after a TextNode", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _block1, _block2, _p2)
  let p1 = doc.get('p1')
  let p2 = doc.get('p2')
  editorSession.setSelection({
    type: 'container',
    startPath: p1.getTextPath(),
    startOffset: 0,
    endPath: p2.getTextPath(),
    endOffset: p2.getLength(),
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes.length, 1, 'There should be only one node left')
  let first = body.getChildAt(0)
  t.ok(first.isText(), '... which is a TextNode')
  t.ok(first.isEmpty(), '... which is empty')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, first.getTextPath(), '... on that TextNode')
  t.equal(sel.start.offset, 0, '... at first position')
  t.end()
})

test.UI("[D20-2]: Deleting a range starting in the middle of a TextNode and ending after a TextNode", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _block1, _block2, _p2)
  let p1 = doc.get('p1')
  let p2 = doc.get('p2')
  editorSession.setSelection({
    type: 'container',
    startPath: p1.getTextPath(),
    startOffset: 3,
    endPath: p2.getTextPath(),
    endOffset: p2.getLength(),
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes.length, 1, 'There should be only one node left')
  let first = body.getChildAt(0)
  t.ok(first.isText(), '... which is a TextNode')
  t.equal(first.getText(), P1_TEXT.slice(0, 3), '... with truncated content')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, first.getTextPath(), '... on that TextNode')
  t.equal(sel.start.offset, 3, '... at last position')
  t.end()
})

test.UI("[D20-3]: Deleting a range starting before a TextNode and ending in the middle of a TextNode", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _block1, _block2, _p2)
  let p1 = doc.get('p1')
  let p2 = doc.get('p2')
  editorSession.setSelection({
    type: 'container',
    startPath: p1.getTextPath(),
    startOffset: 0,
    endPath: p2.getTextPath(),
    endOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes.length, 1, 'There should be only one node left')
  let first = body.getChildAt(0)
  t.ok(first.isText(), '... which is a TextNode')
  t.equal(first.getText(), P2_TEXT.slice(3), '... with sliced content')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, first.getTextPath(), '... on that TextNode')
  t.equal(sel.start.offset, 0, '... at first position')
  t.end()
})

test.UI("[D20-4]: Deleting a range starting in the middle of a TextNode and ending in the middle of a TextNode", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _block1, _block2, _p2)
  let p1 = doc.get('p1')
  let p2 = doc.get('p2')
  editorSession.setSelection({
    type: 'container',
    startPath: p1.getTextPath(),
    startOffset: 3,
    endPath: p2.getTextPath(),
    endOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes.length, 1, 'There should be only one node left')
  let first = body.getChildAt(0)
  t.ok(first.isText(), '... which is a TextNode')
  t.equal(first.getText(), P1_TEXT.slice(0,3)+P2_TEXT.slice(3), '... with merged content')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, first.getTextPath(), '... on that TextNode')
  t.equal(sel.start.offset, 3, '... at correct position')
  t.end()
})

test.UI("[D20-4]: Deleting a range starting in the middle of a TextNode and ending in the middle of a ListItem", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _block1, _block2, _l1)
  let p1 = doc.get('p1')
  let l1 = doc.get('l1')
  editorSession.setSelection({
    type: 'container',
    startPath: p1.getTextPath(),
    startOffset: 3,
    endPath: l1.getItemPath('l1-1'),
    endOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes.length, 2, 'There should be 2 nodes left')
  t.equal(p1.getText(), P1_TEXT.slice(0,3)+LI1_TEXT.slice(3), '... with merged content')
  t.equal(l1.items.length, 1, 'The list should have only 1 item left')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, p1.getTextPath(), '... on p1')
  t.equal(sel.start.offset, 3, '... at correct position')
  t.end()
})

// List Editing
// ------------

// TODO: add specification
test.UI("[L1]: Inserting text into a ListItem", function(t) {
  let { editorSession, doc } = setupEditor(t, _l1)
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
  t.equal(li.getText(), LI1_TEXT.slice(0,3)+'xxx'+LI1_TEXT.slice(3), 'Text should have been inserted correctly.')
  t.equal(sel.start.offset, 6, 'Cursor should be after inserted text')
  t.end()
})

test.UI("[L2]: Breaking a ListItem with cursor in the middle of text", function(t) {
  let { editorSession, doc } = setupEditor(t, _l1)
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
  t.equal(li1.getText(), LI1_TEXT.slice(0,3), 'First item should have been truncated.')
  t.equal(li2.getText(), LI1_TEXT.slice(3), 'remaining line should have been inserted into new list item.')
  t.deepEqual(sel.start.path, l.getItemPath(li2.id), 'Cursor should in second item')
  t.equal(sel.start.offset, 0, 'Cursor should be at begin of item.')
  t.end()
})

test.UI("[L3]: Breaking a ListItem with cursor at begin of text", function(t) {
  let { editorSession, doc } = setupEditor(t, _l1)
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['l1', 'items', 'l1-1', 'content'],
      startOffset: 0
    })
    tx.break()
  })
  let sel = editorSession.getSelection()
  let l = doc.get('l1')
  t.equal(l.items.length, 3, 'List should have 3 items')
  let li1 = doc.get(l.items[0])
  let li2 = doc.get(l.items[1])
  t.equal(li1.getText(), '', 'First item should be empty.')
  t.equal(li2.getText(), LI1_TEXT, 'Text should have moved to next item.')
  t.deepEqual(sel.start.path, l.getItemPath(li2.id), 'Cursor should be in second item')
  t.equal(sel.start.offset, 0, '... at begin of item.')
  t.end()
})

test.UI("[L4]: Splitting a List by breaking an empty ListItem", function(t) {
  let { editorSession, doc } = setupEditor(t, _l1, _l1_empty)
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'property',
      path: ['l1', 'items', 'l1-empty', 'content'],
      startOffset: 0
    })
    tx.break()
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes.length, 3, 'There should be three nodes')
  let l1 = body.getChildAt(0)
  let p = body.getChildAt(1)
  let l2 = body.getChildAt(2)
  t.ok(l1.isList() && p.isText() && l2.isList(), '... list, paragraph, and list')
  t.equal(l1.items.length, 1, 'The first list should now have only one item')
  t.equal(l1.items[0], 'l1-1', '... with id "li-1"')
  t.equal(p.getText(), '', 'The paragraph should be empty')
  t.equal(l2.items.length, 1, 'The second list should now have only one item')
  t.equal(l2.items[0], 'l1-2', '... with id "li-2"')
  t.ok(sel.isCollapsed(), 'The selection should be collapsed')
  t.deepEqual(sel.start.path, p.getTextPath(), '... on the new paragraph')
  t.equal(sel.start.offset, 0, '... at first position')
  t.end()
})

test.UI("[L5-1]: Merging two ListItems using BACKSPACE", function(t) {
  let { editorSession, doc } = setupEditor(t, _l1)
  editorSession.setSelection({
    type: 'property',
    path: ['l1', 'items', 'l1-2', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('left')
  })
  let sel = editorSession.getSelection()
  let l = doc.get('l1')
  t.equal(l.items.length, 1, 'Only one list item should be left')
  let li = l.getItemAt(0)
  t.equal(li.getText(), LI1_TEXT+LI2_TEXT, 'The list item should have the merged text')
  t.ok(sel.isCollapsed(), 'The selection should be collapsed')
  t.deepEqual(sel.start.path, l.getItemPath(li.id), '... on the list item')
  t.equal(sel.start.offset, LI1_TEXT.length, '... at the end of the original content')
  t.end()
})

test.UI("[L5-2]: Merging two ListItems using DELETE", function(t) {
  let { editorSession, doc } = setupEditor(t, _l1)
  editorSession.setSelection({
    type: 'property',
    path: ['l1', 'items', 'l1-1', 'content'],
    startOffset: LI1_TEXT.length,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('right')
  })
  let sel = editorSession.getSelection()
  let l = doc.get('l1')
  t.equal(l.items.length, 1, 'Only one list item should be left')
  let li = l.getItemAt(0)
  t.equal(li.getText(), LI1_TEXT+LI2_TEXT, 'The list item should have the merged text')
  t.ok(sel.isCollapsed(), 'The selection should be collapsed')
  t.deepEqual(sel.start.path, l.getItemPath(li.id), '... on the list item')
  t.equal(sel.start.offset, LI1_TEXT.length, '... at the end of the original content')
  t.end()
})

test.UI("[L6-1]: Merging a List into previous TextNode using BACKSPACE", function(t) {
  let { editorSession, doc } = setupEditor(t, _p1, _l1)
  editorSession.setSelection({
    type: 'property',
    path: ['l1', 'items', 'l1-1', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('left')
  })
  let sel = editorSession.getSelection()
  let p = doc.get('p1')
  let l = doc.get('l1')
  t.equal(l.items.length, 1, 'One list item should be left')
  t.equal(p.getText(), P1_TEXT+LI1_TEXT, 'The text should be merged into the paragraph')
  t.ok(sel.isCollapsed(), 'The selection should be collapsed')
  t.deepEqual(sel.start.path, p.getTextPath(), '... on the paragraph')
  t.equal(sel.start.offset, P1_TEXT.length, '... at the end of the original content')
  t.end()
})

test.UI("[L6-2]: Merging a List into previous List using BACKSPACE", function(t) {
  let { editorSession, doc } = setupEditor(t, _l1, _l2)
  editorSession.setSelection({
    type: 'property',
    path: ['l2', 'items', 'l2-1', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('left')
  })
  let sel = editorSession.getSelection()
  let l1 = doc.get('l1')
  t.equal(l1.items.length, 4, 'First list should have 4 items')
  t.ok(sel.isCollapsed(), 'The selection should be collapsed')
  t.deepEqual(sel.start.path, ['l1', 'items', 'l2-1', 'content'], '... on the same item')
  t.equal(sel.start.offset, 0, '... at the same position')
  t.end()
})

test.UI("[L6-3]: Merging a List into previous List using DELETE", function(t) {
  let { editorSession, doc } = setupEditor(t, _l1, _l2)
  editorSession.setSelection({
    type: 'property',
    path: ['l1', 'items', 'l1-2', 'content'],
    startOffset: LI2_TEXT.length,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('right')
  })
  let sel = editorSession.getSelection()
  let l1 = doc.get('l1')
  t.equal(l1.items.length, 4, 'First list should have 4 items')
  t.ok(sel.isCollapsed(), 'The selection should be collapsed')
  t.deepEqual(sel.start.path, ['l1', 'items', 'l1-2', 'content'], '... on the same item')
  t.equal(sel.start.offset, LI2_TEXT.length, '... at the same position')
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

  constructor(...args) {
    super(...args)
    this.handleActions({
      domSelectionRendered: function() {}
    })
  }

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

function setupEditor(t, ...f) {
  let editor = TestEditor.mount({ editorSession: fixture(...f) }, t.sandbox)
  let editorSession = editor.editorSession
  let doc = editorSession.getDocument()
  return { editor, editorSession, doc }
}

function getConfig() {
  let config = new Configurator()
  config.addToolGroup('annotations')
  config.defineSchema(new DocumentSchema('test-article', 1.0, {
    defaultTextType: 'paragraph'
  }))
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

const P1_TEXT = 'p1:abcdef'

function _p1(doc, body) {
  doc.create({
    type: 'paragraph',
    id: 'p1',
    content: P1_TEXT
  })
  body.show('p1')
}

const P2_TEXT = 'p2:ghijk'

function _p2(doc, body) {
  doc.create({
    type: 'paragraph',
    id: 'p2',
    content: P2_TEXT
  })
  body.show('p2')
}

function _empty(doc, body) {
  doc.create({
    type: 'paragraph',
    id: 'empty',
    content: ''
  })
  body.show('empty')
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

const LI1_TEXT = 'l1-1:abcdef'
const LI2_TEXT = 'l1-2:0123456'

// list with two items
function _l1(doc, body) {
  doc.create({
    type: 'list-item',
    id: 'l1-1',
    content: LI1_TEXT
  })
  doc.create({
    type: 'list-item',
    id: 'l1-2',
    content: LI2_TEXT
  })
  doc.create({
    type: 'list',
    id: 'l1',
    items: ['l1-1', 'l1-2']
  })
  body.show('l1')
}

function _l1_empty(doc) {
  doc.create({
    type: 'list-item',
    id: 'l1-empty',
    content: ''
  })
  let l1 = doc.get('l1')
  l1.insertItemAt(1, 'l1-empty')
}

const LI21_TEXT = 'l2-1:abcdef'
const LI22_TEXT = 'l2-2:0123456'

function _l2(doc, body) {
  doc.create({
    type: 'list-item',
    id: 'l2-1',
    content: LI21_TEXT
  })
  doc.create({
    type: 'list-item',
    id: 'l2-2',
    content: LI22_TEXT
  })
  doc.create({
    type: 'list',
    id: 'l2',
    items: ['l2-1', 'l2-2']
  })
  body.show('l2')
}


function _block1(doc, body) {
  doc.create({
    type: 'test-block',
    id: 'block1'
  })
  body.show('block1')
}

function _block2(doc, body) {
  doc.create({
    type: 'test-block',
    id: 'block2'
  })
  body.show('block2')
}

class TestInlineNode extends InlineNode {}
TestInlineNode.type = 'test-inline'
TestInlineNode.schema = {
  foo: { type: 'string' }
}

class TestBlockNode extends BlockNode {}
TestBlockNode.type = 'test-block'

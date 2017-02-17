/* eslint-disable no-use-before-define */
import { module } from 'substance-test'
import Document from '../model/Document'
import EditingInterface from '../model/EditingInterface'
import setupEditor from './fixture/setupEditor'
import headersAndParagraphs from './fixture/headersAndParagraphs'
import {
  _p1, P1_TEXT,
  _p2, P2_TEXT,
  _s1, _empty, _il1,
  _block1, _block2,
  _in1, IN1_TITLE,
  _l1, _l1_empty, _l1_empty_last,
  _l2, _li1plus, _li3, LI1_TEXT, LI2_TEXT, LI3_TEXT,
  _t1, _t1_sparse, T_CONTENT
} from './fixture/samples'

const test = module('Editing')

// TODO: consolidate specification and 'category labels' of tests

// TODO: we should enable t.sandbox for all tests so that this implementation is
// tested on all platforms

test("IT1: Inserting text with cursor in the middle of a TextProperty", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.insertText('xxx')
  }, { action: 'type' })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  t.equal(p1.getText(), P1_TEXT.slice(0,3)+'xxx'+P1_TEXT.slice(3), 'Text should have been inserted correctly.')
  t.equal(sel.start.offset, 6, 'Cursor should be after inserted text')
  t.end()
})

test("IT2: Inserting text with cursor within TextProperty inside annotation", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.insertText('xxx')
  }, { action: 'type' })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  let s1 = doc.get('s1')
  t.equal(p1.getText(), P1_TEXT.slice(0,4)+'xxx'+P1_TEXT.slice(4), 'Text should have been inserted correctly.')
  t.equal(s1.end.offset, 8, 'Annotation should have been expanded.')
  t.equal(sel.start.offset, 7, 'Cursor should be after inserted text')
  t.end()
})

test("IT3: Inserting text with cursor within TextProperty at the start of an annotation", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.insertText('xxx')
  }, { action: 'type' })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  let s1 = doc.get('s1')
  t.equal(p1.getText(), P1_TEXT.slice(0,3)+'xxx'+P1_TEXT.slice(3), 'Text should have been inserted correctly.')
  t.equal(s1.start.offset, 6, 'Annotation should have been moved.')
  t.equal(s1.end.offset, 8, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 6, 'Cursor should be after inserted text')
  t.end()
})

test("IT4: Inserting text with cursor within TextProperty at the end of an annotation", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 5,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.insertText('xxx')
  }, { action: 'type' })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  let s1 = doc.get('s1')
  t.equal(p1.getText(), P1_TEXT.slice(0,5)+'xxx'+P1_TEXT.slice(5), 'Text should have been inserted correctly.')
  t.equal(s1.start.offset, 3, 'Annotation should have been moved.')
  t.equal(s1.end.offset, 8, 'Annotation should have been moved.')
  t.equal(sel.start.offset, 8, 'Cursor should be after inserted text')
  t.end()
})

test("IT5: Inserting text with range within TextProperty", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 2,
    endOffset: 5,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.insertText('xxx')
  }, { action: 'type' })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  t.equal(p1.getText(), P1_TEXT.slice(0, 2)+'xxx'+P1_TEXT.slice(5), 'Text should have been inserted correctly.')
  t.equal(sel.start.offset, 5, 'Cursor should be after inserted text')
  t.ok(sel.isCollapsed(), '... collapsed')
  t.end()
})

test("IT6: Inserting text with range within TextProperty overlapping an annotion aligned at the left side", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
  doc.set(['s1', 'end', 'offset'], 6)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    endOffset: 5,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.insertText('xxx')
  }, { action: 'type' })
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

test("IT7: Inserting text with range within TextProperty inside an annotion", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    endOffset: 5,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.insertText('xxx')
  }, { action: 'type' })
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

test("IT8: Inserting text with range within TextProperty starting inside an annotion", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
  doc.set(['s1', 'end', 'offset'], 6)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4,
    endOffset: 6,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.insertText('xxx')
  }, { action: 'type' })
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

test("IT9: Inserting text after an InlineNode node", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1, _il1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.insertText('Y')
  }, { action: 'type' })
  let sel = editorSession.getSelection()
  let p1 = doc.get('p1')
  let il1 = doc.get('il1')
  t.equal(p1.getText(), P1_TEXT.slice(0,3)+'\uFEFF'+'Y'+P1_TEXT.slice(3), 'Text should have been inserted correctly.') // eslint-disable-line no-useless-concat
  t.equal(sel.start.offset, 5, 'Cursor should be after inserted character')
  t.deepEqual([il1.start.offset, il1.end.offset], [3,4], 'InlineNode should have correct dimensions')
  t.end()
})

test("IT10: Typing over an InlineNode node", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1, _il1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    endOffset: 4,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.insertText('Y')
  }, { action: 'type' })
  let p1 = doc.get('p1')
  let il1 = doc.get('il1')
  t.nil(il1, 'InlineNode should have been deleted.')
  t.equal(p1.getText(), P1_TEXT.slice(0,3)+'Y'+P1_TEXT.slice(3), 'Text should have been inserted correctly.') // eslint-disable-line no-useless-concat
  t.end()
})

test("II1: Inserting InlineNode node into a TextProperty", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.insertInlineNode({
      type: 'test-inline-node',
      id: 'il1',
      content: 'X'
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

test("IB2: Inserting BlockNode using cursor at start of a TextNode", (t) => {
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

test("D-0: Deleting without selection", (t) => {
  let { editorSession } = setupEditor(t, _p1, _p2)
  editorSession.setSelection(null)
  t.doesNotThrow(() => {
    editorSession.transaction((tx) => {
      tx.deleteCharacter('right')
    })
  }, 'Should not throw')
  t.end()
})

test("DR2: Deleting using DELETE with cursor at the end of a TextNode at the end of a Container", (t) => {
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

test("DR3: Deleting using DELETE with cursor in the middle of a TextProperty", (t) => {
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

test("DR4-1: Deleting using DELETE with cursor inside an empty TextNode and TextNode as successor", (t) => {
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

test("DR4-2: Deleting using DELETE with cursor inside an empty TextNode and IsolatedNode as successor", (t) => {
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
  t.equal(sel.getNodeId(), 'block1', '... block1')
  t.end()
})

test("DR4-3: Deleting using DELETE with cursor inside an empty TextNode and List as successor", (t) => {
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
  t.equal(body.nodes.length, 2, 'There should be only 2 nodes left.')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, ['l1-1', 'content'], '... on first list item')
  t.equal(sel.start.offset, 0,'... at first position')
  t.end()
})

test("DR5-1: Deleting using DELETE with cursor at the end of a non-empty TextNode and TextNode as successor", (t) => {
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

test("DR5-2: Deleting using DELETE with cursor at the end of a non-empty TextNode and IsolatedNode as successor", (t) => {
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


test("DL3: Deleting using BACKSPACE with cursor in the middle of a TextProperty", (t) => {
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

test("DL4-1: Deleting using BACKSPACE with cursor inside an empty TextNode and TextNode as predecessor", (t) => {
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

test("DL4-2: Deleting using BACKSPACE with cursor inside an empty TextNode and IsolatedNode as predecessor", (t) => {
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
  t.end()
})

// TODO: DL4 with List as predecessor

test("DL5-1: Deleting using BACKSPACE with cursor at the start of a non-empty TextNode and TextNode as predecessor", (t) => {
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

test("DL5-2: Deleting using BACKSPACE with cursor at the start of a non-empty TextNode and IsolatedNode as predecessor", (t) => {
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

test("DL13: Deleting using BACKSPACE with cursor after IsolatedNode", (t) => {
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

test("DL16: Deleting using BACKSPACE with cursor before IsolatedNode with TextNode as predecessor", (t) => {
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

test("DL17: Deleting using BACKSPACE with cursor before IsolatedNode and IsolatedNode as predecessor", (t) => {
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

test("D10: Deleting an entirely selected IsolatedNode", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1, _block1, _p2)
  editorSession.setSelection({
    type: 'node',
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

test("D20-1: Deleting a range starting before a TextNode and ending after a TextNode", (t) => {
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

test("D20-2: Deleting a range starting in the middle of a TextNode and ending after a TextNode", (t) => {
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

test("D20-3: Deleting a range starting before a TextNode and ending in the middle of a TextNode", (t) => {
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

test("D20-4: Deleting a range starting in the middle of a TextNode and ending in the middle of a TextNode", (t) => {
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

test("D20-5: Deleting a range starting in the middle of a TextNode and ending in the middle of a ListItem", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1, _block1, _block2, _l1)
  let p1 = doc.get('p1')
  let l1 = doc.get('l1')
  editorSession.setSelection({
    type: 'container',
    startPath: p1.getTextPath(),
    startOffset: 3,
    endPath: ['l1-1', 'content'],
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

test("D20-6: Deleting a range starting in the middle of a ListItem and ending in the middle of a TextNode", (t) => {
  let { editorSession, doc } = setupEditor(t, _l1, _block1, _block2, _p1)
  let p1 = doc.get('p1')
  let l1 = doc.get('l1')
  editorSession.setSelection({
    type: 'container',
    startPath: ['l1-2', 'content'],
    startOffset: 3,
    endPath: p1.getTextPath(),
    endOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes.length, 1, 'There should be 1 node left')
  t.equal(l1.items.length, 2, 'The list should have 2 items')
  let li2 = l1.getItemAt(1)
  t.equal(li2.getText(), LI2_TEXT.slice(0,3)+P1_TEXT.slice(3), 'The second item should container merged content')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, li2.getTextPath(), '... on second list item')
  t.equal(sel.start.offset, 3, '... at correct position')
  t.end()
})

test("D20-7: Deleting a range within a ListItem", (t) => {
  let { editorSession, doc } = setupEditor(t, _l1)
  let l1 = doc.get('l1')
  editorSession.setSelection({
    type: 'container',
    startPath: ['l1-2', 'content'],
    startOffset: 3,
    endPath: ['l1-2', 'content'],
    endOffset: 6,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })
  let sel = editorSession.getSelection()
  t.equal(l1.items.length, 2, 'The list should have 2 items')
  let li2 = l1.getItemAt(1)
  t.equal(li2.getText(), LI2_TEXT.slice(0,3)+LI2_TEXT.slice(6), 'The second item should be changed')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, li2.getTextPath(), '... on second list item')
  t.equal(sel.start.offset, 3, '... at correct position')
  t.end()
})

test("D20-8: Deleting a range across two ListItems within the same List", (t) => {
  let { editorSession, doc } = setupEditor(t, _l1)
  let l1 = doc.get('l1')
  editorSession.setSelection({
    type: 'container',
    startPath: ['l1-1', 'content'],
    startOffset: 3,
    endPath: ['l1-2', 'content'],
    endOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })
  let sel = editorSession.getSelection()
  t.equal(l1.items.length, 1, 'The list should have 1 item')
  let li1 = l1.getItemAt(0)
  t.equal(li1.getText(), LI1_TEXT.slice(0,3)+LI2_TEXT.slice(3), 'The items should be merged')
  t.ok(sel.isCollapsed(), 'Selection should be collapsed')
  t.deepEqual(sel.start.path, li1.getTextPath(), '... on the list item')
  t.equal(sel.start.offset, 3, '... at correct position')
  t.end()
})

test("BR1: Breaking without selection", (t) => {
  let { editorSession } = setupEditor(t, _p1)
  editorSession.setSelection(null)
  t.doesNotThrow(() => {
    editorSession.transaction((tx) => {
      tx.break()
    })
  })
  t.end()
})

test("BR2: Breaking a TextNode", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.break()
  }, { action: 'break' })
  let body = doc.get('body')
  t.equals(body.length, 2, 'There should be 2 nodes')
  let first = body.getChildAt(0)
  let second = body.getChildAt(1)
  t.equals(second.type, 'paragraph', 'Second should be a paragraph')
  t.equals(first.getText(), P1_TEXT.slice(0,3), 'First should be truncated')
  t.equals(second.getText(), P1_TEXT.slice(3), '.. and second should contain the tail')
  t.end()
})

test("BR3: Breaking annotated text with cursor before the annotation", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.break()
  }, { action: 'break' })
  let body = doc.get('body')
  let second = body.getChildAt(1)
  let anno = doc.get('s1')
  t.deepEqual(anno.start.path, second.getPath(), 'Annotation should now be on the second paragraph')
  t.equal(anno.start.offset, 2, '.. starting at character 2')
  t.equal(anno.end.offset, 4, '.. ending at character 4')
  t.end()
})

test("BR4: Breaking annotated text with cursor inside the annotation", (t) => {
  let { editorSession, doc } = setupEditor(t, _p1, _s1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.break()
  }, { action: 'break' })
  let body = doc.get('body')
  let secondPara = body.getChildAt(1)
  let anno = doc.get('s1')
  t.equal(anno.start.offset, 3, '.. starting at character 3')
  t.equal(anno.end.offset, 4, '.. ending at character 4')
  let secondAnno = doc.getIndex('annotations').get([secondPara.id, 'content'])[0]
  t.equal(secondAnno.start.offset, 0, '.. starting at character 0')
  t.equal(secondAnno.end.offset, 1, '.. ending at character 1')
  t.end()
})

// List Editing
// ------------

// TODO: add specification
test("L1: Inserting text into a ListItem", (t) => {
  let { editorSession, doc } = setupEditor(t, _l1)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.insertText('xxx')
  }, { action: 'type' })
  let sel = editorSession.getSelection()
  let li = doc.get('l1-1')
  t.equal(li.getText(), LI1_TEXT.slice(0,3)+'xxx'+LI1_TEXT.slice(3), 'Text should have been inserted correctly.')
  t.equal(sel.start.offset, 6, 'Cursor should be after inserted text')
  t.end()
})

test("L2: Breaking a ListItem with cursor in the middle of text", (t) => {
  let { editorSession, doc } = setupEditor(t, _l1)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.break()
  }, { action: 'break' })
  let sel = editorSession.getSelection()
  let l = doc.get('l1')
  t.equal(l.items.length, 3, 'List should have 3 items')
  let li1 = doc.get(l.items[0])
  let li2 = doc.get(l.items[1])
  t.equal(li1.getText(), LI1_TEXT.slice(0,3), 'First item should have been truncated.')
  t.equal(li2.getText(), LI1_TEXT.slice(3), 'remaining line should have been inserted into new list item.')
  t.deepEqual(sel.start.path, li2.getTextPath(), 'Cursor should in second item')
  t.equal(sel.start.offset, 0, 'Cursor should be at begin of item.')
  t.end()
})

test("L3: Breaking a ListItem with cursor at begin of text", (t) => {
  let { editorSession, doc } = setupEditor(t, _l1)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-1', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.break()
  }, { action: 'break' })
  let sel = editorSession.getSelection()
  let l = doc.get('l1')
  t.equal(l.items.length, 3, 'List should have 3 items')
  let li1 = doc.get(l.items[0])
  let li2 = doc.get(l.items[1])
  t.equal(li1.getText(), '', 'First item should be empty.')
  t.equal(li2.getText(), LI1_TEXT, 'Text should have moved to next item.')
  t.deepEqual(sel.start.path, li2.getTextPath(), 'Cursor should be in second item')
  t.equal(sel.start.offset, 0, '... at begin of item.')
  t.end()
})

test("L4: Splitting a List by breaking an empty ListItem", (t) => {
  let { editorSession, doc } = setupEditor(t, _l1, _l1_empty)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-empty', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.break()
  }, { action: 'break' })
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

test("L4-2: Breaking the last empty list item", (t) => {
  let { editorSession, doc } = setupEditor(t, _l1, _l1_empty_last)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-empty', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.break()
  }, { action: 'break' })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.nodes.length, 2, 'There should be two nodes')
  let l1 = body.getChildAt(0)
  let p = body.getChildAt(1)
  t.ok(l1.isList() && p.isText(), '... list, and paragraph')
  t.equal(l1.items.length, 2, 'The list should now have only two items')
  t.equal(p.getText(), '', 'The paragraph should be empty')
  t.ok(sel.isCollapsed(), 'The selection should be collapsed')
  t.deepEqual(sel.start.path, p.getTextPath(), '... on the new paragraph')
  t.equal(sel.start.offset, 0, '... at first position')
  t.end()
})

test("L5-1: Toggling a ListItem using BACKSPACE", (t) => {
  let { editorSession, doc } = setupEditor(t, _l1)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-2', 'content'],
    startOffset: 0,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.deleteCharacter('left')
  })
  let sel = editorSession.getSelection()
  let body = doc.get('body')
  t.equal(body.getLength(), 2, 'There should be two nodes now')
  let l = doc.get('l1')
  let p = body.getChildAt(1)
  t.equal(l.items.length, 1, 'Only one list item should be left')
  t.equal(p.type, 'paragraph', 'The second one should be a paragraph')
  t.equal(p.getText(), LI2_TEXT, '.. with the text of the second item')
  t.ok(sel.isCollapsed(), 'The selection should be collapsed')
  t.deepEqual(sel.start.path, p.getTextPath(), '... on the new paragraph')
  t.equal(sel.start.offset, 0, '... at first position')
  t.end()
})

test("L5-2: Merging two ListItems using DELETE", (t) => {
  let { editorSession, doc } = setupEditor(t, _l1)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-1', 'content'],
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
  t.deepEqual(sel.start.path, li.getTextPath(), '... on the list item')
  t.equal(sel.start.offset, LI1_TEXT.length, '... at the end of the original content')
  t.end()
})

test("L6-1: Merging a List into previous List using DELETE", (t) => {
  let { editorSession, doc } = setupEditor(t, _l1, _l2)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-2', 'content'],
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
  t.deepEqual(sel.start.path, ['l1-2', 'content'], '... on the same item')
  t.equal(sel.start.offset, LI2_TEXT.length, '... at the same position')
  t.end()
})

test("L8-1: Toggling a paragraph into a List", (t) => {
  let { doc, editorSession} = setupEditor(t, _p1)
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx)=>{
    tx.toggleList({ ordered: false})
  })
  let body = doc.get('body')
  t.equal(body.getLength(), 1, 'There should be 1 node')
  let l = body.getNodeAt(0)
  t.equal(l.type, 'list', '.. a list')
  t.equal(l.ordered, false, '.. unordered')
  t.equal(l.getLength(), 1, '.. with one item')
  let li = l.getItemAt(0)
  t.equal(li.getText(), P1_TEXT, '.. with text of p1')
  t.end()
})

test("L8-2: Toggling first list-item into a paragraph", (t) => {
  let { doc, editorSession} = setupEditor(t, _l1)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx)=>{
    tx.toggleList()
  })
  let body = doc.get('body')
  t.equal(body.getLength(), 2, 'There should be 2 nodes')
  let p = body.getNodeAt(0)
  let l = body.getNodeAt(1)
  t.equal(p.type, 'paragraph', '.. first should be paragraph')
  t.equal(p.getText(), LI1_TEXT, '.. with text of first list item')
  t.equal(l.type, 'list', '.. second should be alist')
  t.equal(l.getLength(), 1, '.. with one item')
  t.end()
})

test("L8-2: Toggling last list-item into a paragraph", (t) => {
  let { doc, editorSession} = setupEditor(t, _l1)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-2', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx)=>{
    tx.toggleList()
  })
  let body = doc.get('body')
  t.equal(body.getLength(), 2, 'There should be 2 nodes')
  let l = body.getNodeAt(0)
  let p = body.getNodeAt(1)
  t.equal(l.type, 'list', '.. first should be alist')
  t.equal(l.getLength(), 1, '.. with one item')
  t.equal(p.type, 'paragraph', '.. second should be paragraph')
  t.equal(p.getText(), LI2_TEXT, '.. with text of second list item')
  t.end()
})

test("L8-2: Toggling a middle list-item into a paragraph splitting the list", (t) => {
  let { doc, editorSession} = setupEditor(t, _l1, _li3)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-3', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx)=>{
    tx.toggleList()
  })
  let body = doc.get('body')
  t.equal(body.getLength(), 3, 'There should be 3 nodes')
  let l = body.getNodeAt(0)
  let p = body.getNodeAt(1)
  let l2 = body.getNodeAt(2)
  t.equal(l.type, 'list', '.. first should be alist')
  t.equal(l.getLength(), 1, '.. with one item')
  t.equal(p.type, 'paragraph', '.. second should be paragraph')
  t.equal(p.getText(), LI3_TEXT, '.. with text of second list item')
  t.equal(l2.type, 'list', '.. last should be a list again')
  t.equal(l2.getLength(), 1, '.. with one item')
  t.end()
})

test("L9-1: Indenting a ListItem", (t) => {
  let { doc, editorSession } = setupEditor(t, _l1)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.indent()
  })
  let li1 = doc.get('l1-1')
  t.equal(li1.level, 2, 'Indentation level should have increased')
  t.end()
})

test("L9-1: Dedenting a ListItem", (t) => {
  let { doc, editorSession } = setupEditor(t, _l1, _li1plus)
  editorSession.setSelection({
    type: 'property',
    path: ['l1-1', 'content'],
    startOffset: 3,
    containerId: 'body'
  })
  editorSession.transaction((tx) => {
    tx.dedent()
  })
  let li1 = doc.get('l1-1')
  t.equal(li1.level, 1, 'Indentation level should have decreased')
  t.end()
})

test("IN-1: Inserting text in an IsolatedNode", (t) => {
  let { doc, editorSession } = setupEditor(t, _p1, _in1, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['in1', 'title'],
    startOffset: 3
  })

  editorSession.transaction((tx) => {
    tx.insertText('xxx')
  })
  let in1 = doc.get('in1')
  t.equal(in1.title, IN1_TITLE.slice(0,3)+'xxx'+IN1_TITLE.slice(3), 'Text should be inserted into field')
  t.end()
})

test("IN-2: Deleting a character in an IsolatedNode", (t) => {
  let { doc, editorSession } = setupEditor(t, _p1, _in1, _p2)
  editorSession.setSelection({
    type: 'property',
    path: ['in1', 'title'],
    startOffset: 3
  })

  editorSession.transaction((tx) => {
    tx.deleteCharacter('right')
  })
  let in1 = doc.get('in1')
  t.equal(in1.title, IN1_TITLE.slice(0,3)+IN1_TITLE.slice(4), 'Text should be inserted into field')
  t.end()
})



// test("Create property annotation for a given property selection", (t) => {
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

// test("Create container annotation for a given container selection", (t) => {
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

test("C-1 Copying a property selection", (t) => {
  let { doc } = setupEditor(t, headersAndParagraphs)
  let editor = new EditingInterface(doc)
  editor.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 4,
    endOffset: 9,
    containerId: 'body'
  })
  let copy = editor.copySelection()
  let textNode = copy.get(Document.TEXT_SNIPPET_ID)
  t.notNil(textNode, 'There should be a text node for the property fragment.')
  t.equal(textNode.content, 'graph', 'Selected text should be copied.')
  t.end()
})

test("C-2 Copying a property selection with annotated text", (t) => {
  let { doc } = setupEditor(t, headersAndParagraphs)
  let editor = new EditingInterface(doc)
  editor.setSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 10,
    endOffset: 19,
    containerId: 'body'
  })
  let copy = editor.copySelection()
  t.equal(copy.get([Document.TEXT_SNIPPET_ID, 'content']), 'with anno', 'Selected text should be copied.')
  let annos = copy.getIndex('annotations').get([Document.TEXT_SNIPPET_ID, 'content'])
  t.equal(annos.length, 1, 'There should be one annotation on copied text.')
  let anno = annos[0]
  t.equal(anno.type, "emphasis", "The annotation should be 'emphasis'.")
  t.deepEqual([anno.start.offset, anno.end.offset], [5, 9], 'The annotation should be over the text "anno".')
  t.end()
})

test("C-3 Copying a container selection", (t) => {
  let { doc } = setupEditor(t, headersAndParagraphs)
  let editor = new EditingInterface(doc)
  editor.setSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['h1', 'content'],
    startOffset: 4,
    endPath: ['p2', 'content'],
    endOffset: 9,
  })
  let copy = editor.copySelection()
  let content = copy.get(Document.SNIPPET_ID)
  t.notNil(content, 'There should be a container node with id "content".')
  // 4 nodes? 'body', 'snippets', 'p1', 'p2'
  t.equal(content.nodes.length, 4, 'There should be 4 nodes in the copied document.')
  let first = copy.get(content.nodes[0])
  t.equal(first.type, 'heading', "The first node should be a heading.")
  t.equal(first.content, 'ion 1', "Its content should be truncated to 'ion 1'.")
  let last = copy.get(content.nodes[3])
  t.equal(last.type, 'paragraph', "The last node should be a paragraph.")
  t.equal(last.content, 'Paragraph', "Its content should be truncated to 'Paragraph'.")
  t.end()
})

test("C-4 Copying a paragraph", (t) => {
  let { doc } = setupEditor(t, _p1, _p2)
  let editor = new EditingInterface(doc)
  editor.setSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2'],
    startOffset: 0,
    endPath: ['p2'],
    endOffset: 1
  })
  let copy = editor.copySelection()
  let p2 = copy.get('p2')
  t.equal(p2.content, doc.get('p2').content, 'The whole paragraph should be copied.')
  t.end()
})

test("C-5: Copying two ListItems", (t) => {
  let { doc } = setupEditor(t, _l1)
  let editor = new EditingInterface(doc)
  editor.setSelection({
    type: 'container',
    startPath: ['l1-1', 'content'],
    startOffset: 3,
    endPath: ['l1-2', 'content'],
    endOffset: 3,
    containerId: 'body'
  })
  let copy = editor.copySelection()
  let content = copy.getContainer()
  t.equal(content.getLength(), 1, 'There should be one node')
  let l1 = copy.get('l1')
  t.notNil(l1, 'l1 should exist')
  t.equal(l1.getLength(), 2, '.. having 2 items')
  let li1 = l1.getItemAt(0)
  let li2 = l1.getItemAt(1)
  t.equal(li1.getText(), LI1_TEXT.slice(3), 'The first item should have correct content')
  t.equal(li2.getText(), LI2_TEXT.slice(0, 3), 'The second item should have correct content')
  t.end()
})

test("C-6: Copying a paragraph and a ListItem", (t) => {
  let { doc } = setupEditor(t, _p1, _l1)
  let editor = new EditingInterface(doc)
  editor.setSelection({
    type: 'container',
    startPath: ['p1', 'content'],
    startOffset: 3,
    endPath: ['l1-1', 'content'],
    endOffset: 3,
    containerId: 'body'
  })
  let copy = editor.copySelection()
  let content = copy.getContainer()
  t.equal(content.getLength(), 2, 'There should be 2 nodes')
  let l1 = copy.get('l1')
  t.notNil(l1, 'l1 should exist')
  t.equal(l1.getLength(), 1, '.. having 1 item')
  let li1 = l1.getItemAt(0)
  t.equal(li1.getText(), LI1_TEXT.slice(0, 3), 'The first item should have correct content')
  t.end()
})

test("C-7 Copying a table", (t) => {
  let { doc } = setupEditor(t, _t1)
  let editor = new EditingInterface(doc)
  editor.setSelection({
    type: 'node',
    nodeId: 't1',
    containerId: 'body',
  })
  let copy = editor.copySelection()
  let t1 = copy.get('t1')
  t.notNil(t1, 'Table node should exist')
  t.equals(t1.getRowCount(), 2, '.. with two rows')
  t.equals(t1.getColCount(), 2, '.. with two cols')
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      let cell = t1.getCellAt(row,col)
      t.notNil(cell, `Cell (${row+1},${col+1}) should exist`)
      t.equals(cell.content, T_CONTENT[row][col], '.. and have correct content')
    }
  }
  t.end()
})

test("C-8 Copying a sparse table", (t) => {
  let { doc } = setupEditor(t, _t1_sparse)
  let editor = new EditingInterface(doc)
  editor.setSelection({
    type: 'node',
    nodeId: 't1',
    containerId: 'body',
  })
  let copy = editor.copySelection()
  let t1 = copy.get('t1')
  t.notNil(t1, 'Table node should exist')
  t.equals(t1.getRowCount(), 2, '.. with two rows')
  t.equals(t1.getColCount(), 2, '.. with two cols')
  for (let i = 0; i < 2; i++) {
    let cell = t1.getCellAt(i,i)
    t.notNil(cell, `Cell (${i+1},${i+1}) should exist`)
    t.equals(cell.content, T_CONTENT[i][i], '.. and have correct content')
    t.nil(t1.getCellAt(1-i, i), `Cell (${1-i+1},${i+1}) should not exist`)
  }
  t.end()
})

// NOTE: with Copy'n'Paste within the same document,
// we must make sure to check that things are cloned correctly,
// e.g., not that inadvertantly the copy references one of the original children

test("CP-5: Copy and Pasting a List", (t) => {
  let { doc, editorSession } = setupEditor(t, _p1, _empty, _l1)
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'container',
      startPath: ['l1-1', 'content'],
      startOffset: 0,
      endPath: ['l1-2', 'content'],
      endOffset: LI2_TEXT.length,
      containerId: 'body'
    })
    let copy = tx.copySelection()
    tx.setSelection({
      type: 'property',
      path: ['empty', 'content'],
      startOffset: 0,
      containerId: 'body'
    })
    tx.paste(copy)
  })
  let body = doc.get('body')
  let nodes = body.getNodes()
  t.equal(body.length, 3, "There should be 3 nodes")
  t.deepEqual(['paragraph', 'list', 'list'], nodes.map(n => n.type), '.. a paragraph and 2 lists')
  let li1 = body.getChildAt(1)
  let li2 = body.getChildAt(2)
  t.notDeepEqual(li1.items, li2.items, 'List items should not be the same.')
  t.equal(li1.getItemAt(0).getText(), li2.getItemAt(0).getText(), 'First list item should have same content')
  t.equal(li1.getItemAt(1).getText(), li2.getItemAt(1).getText(), 'Second list item should have same content')
  t.end()
})

test("CP-6: Copy and Pasting a List partially", (t) => {
  let { doc, editorSession } = setupEditor(t, _p1, _empty, _l1)
  editorSession.transaction((tx) => {
    tx.setSelection({
      type: 'container',
      startPath: ['l1-1', 'content'],
      startOffset: 3,
      endPath: ['l1-2', 'content'],
      endOffset: 3,
      containerId: 'body'
    })
    let copy = tx.copySelection()
    tx.setSelection({
      type: 'property',
      path: ['empty', 'content'],
      startOffset: 0,
      containerId: 'body'
    })
    tx.paste(copy)
  })
  let body = doc.get('body')
  let nodes = body.getNodes()
  t.equal(body.length, 3, "There should be 3 nodes")
  t.deepEqual(['paragraph', 'list', 'list'], nodes.map(n => n.type), '.. a paragraph and 2 lists')
  let li1 = body.getChildAt(1)
  let li2 = body.getChildAt(2)
  t.notDeepEqual(li1.items, li2.items, 'List items should not be the same.')
  t.equal(li1.getItemAt(0).getText(), LI1_TEXT.slice(3), 'First list item should be truncated')
  t.equal(li1.getItemAt(1).getText(), LI2_TEXT.slice(0,3), 'Second list item should be truncated')
  t.end()
})

test("CP-7 Copy and Pasting a table", (t) => {
  let { doc, editorSession } = setupEditor(t, _t1, _empty)
  editorSession.setSelection({
    type: 'node',
    nodeId: 't1',
    containerId: 'body',
  })
  editorSession.transaction((tx)=>{
    let copy = tx.copySelection()
    tx.setSelection({
      type: 'property',
      path: ['empty', 'content'],
      startOffset: 0,
      containerId: 'body'
    })
    tx.paste(copy)
  })
  let body = doc.get('body')
  let t1 = doc.get('t1')
  let t2 = body.getNodeAt(1)
  t.equal(t2.type, 'table', 'Second node should be table.')
  t.equals(t2.getRowCount(), 2, '.. with two rows')
  t.equals(t2.getColCount(), 2, '.. with two cols')
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      let cell = t2.getCellAt(row,col)
      let origCell = t1.getCellAt(row, col)
      t.notNil(cell, `Cell (${row+1},${col+1}) should exist`)
      t.notEqual(cell, origCell, `.. should be different to the original cell`)
      t.equals(cell.content, T_CONTENT[row][col], '.. and have correct content')
    }
  }
  t.end()
})

// test("CP-8 Copy and Pasting a sparse table", (t) => {
//   let { doc } = setupEditor(t, _t1_sparse)
//   let editor = new EditingInterface(doc)
//   editor.setSelection({
//     type: 'node',
//     nodeId: 't1',
//     containerId: 'body',
//   })
//   let copy = editor.copySelection()
//   let t1 = copy.get('t1')
//   t.notNil(t1, 'Table node should exist')
//   t.equals(t1.getRowCount(), 2, '.. with two rows')
//   t.equals(t1.getColCount(), 2, '.. with two cols')
//   for (let i = 0; i < 2; i++) {
//     let cell = t1.getCellAt(i,i)
//     t.notNil(cell, `Cell (${i+1},${i+1}) should exist`)
//     t.equals(cell.content, T_CONTENT[i][i], '.. and have correct content')
//     t.nil(t1.getCellAt(1-i, i), `Cell (${1-i+1},${i+1}) should not exist`)
//   }
//   t.end()
// })

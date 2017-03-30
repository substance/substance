import { module } from 'substance-test'
import { documentHelpers } from 'substance'
import fixture from './fixture/createTestArticle'
import simple from './fixture/simple'
import containerAnnoSample from './fixture/containerAnnoSample'
import {_l1, _l11, _l12, _l13, LI1_TEXT, LI2_TEXT, LI3_TEXT } from './fixture/samples'

const test = module('documentHelpers')

test("Get annotations for selection", (t) => {
  let doc = fixture(simple)
  const path = ["p1", "content"]
  doc.create({ type: 'strong', path, startOffset: 0, endOffset: 1})
  doc.create({ type: 'emphasis', path, startOffset: 2, endOffset: 3})
  doc.create({ type: 'strong', path, startOffset: 5, endOffset: 6})
  // this lies outside of selection
  doc.create({ type: 'strong', path, startOffset: 6, endOffset: 7})
  let sel = doc.createSelection({
    type: "property",
    path,
    startOffset: 0,
    endOffset: 5
  })
  let annos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel)
  t.equal(annos.length, 3, "should return 3 annos for selection")
  // filtered by type
  annos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel, { type: 'emphasis'})
  t.equal(annos.length, 1, "should return one anno")
  t.equal(annos[0].type, 'emphasis', ".. of type emphasis")
  t.end()
})

test("Get text for null selection.", (t) => {
  let doc = fixture(simple)
  t.equal(documentHelpers.getTextForSelection(doc, null), "", "Should be empty for null selection.")
  t.equal(documentHelpers.getTextForSelection(doc, doc.createSelection(null)), "", "Should be empty for null selection.")
  t.end()
})

test("Get text for property selection", (t) => {
  let doc = fixture(simple)
  let sel = doc.createSelection({
    type: "property",
    path: ["p1", "content"],
    startOffset: 0,
    endOffset: 5
  })
  t.equal(documentHelpers.getTextForSelection(doc, sel), "01234")
  t.end()
})

test("Get text for container selection", (t) => {
  let doc = fixture(simple)
  let sel = doc.createSelection({
    type: "container",
    containerId: "body",
    startPath: ["p1", "content"],
    startOffset: 5,
    endPath: ["p2", "content"],
    endOffset: 5
  })
  t.equal(documentHelpers.getTextForSelection(doc, sel), "56789\n01234")
  t.end()
})

test("Get change from document", (t) => {
  let doc = fixture(simple)
  doc.create({ type: 'strong', id: 's1', path: ["p1", "content"], startOffset: 0, endOffset: 1})
  let change = documentHelpers.getChangeFromDocument(doc)
  t.equal(change.ops.length, 6, 'There should be 6 operations')
  t.deepEqual(change.ops.map(op => op.type), new Array(6).fill('create'), 'all should be create ops')
  t.deepEqual(change.ops.map(op => op.path[0]), ['p1', 'p2', 'p3', 'p4', 'body', 's1'], '.. in the correct order')
  t.end()
})

test("deleteNode()", (t) => {
  let doc = fixture(simple)
  ;[_l1, _l11].forEach(f=>f(doc, doc.get('body')))
  doc.create({ type: 'strong', id: 's1', path: ["p1", "content"], startOffset: 0, endOffset: 1})
  documentHelpers.deleteNode(doc, doc.get('p1'))
  t.nil(doc.get('p1'), 'node should have been deleted')
  t.nil(doc.get('s1'), 'annotation should have been deleted too')
  documentHelpers.deleteNode(doc, doc.get('l1'))
  t.nil(doc.get('l1'), 'node should have been deleted')
  t.nil(doc.get('l1-1'), 'list item should have been deleted too')
  t.end()
})

test("deleteTextRange()", (t) => {
  const path = ['p1', 'content']
  // anno is after
  let doc = fixture(simple)
  let s1 = doc.create({ type: 'strong', id: 's1', path: ["p1", "content"], startOffset: 5, endOffset: 6})
  documentHelpers.deleteTextRange(doc, { path, offset: 0 }, { path, offset: 2 })
  t.deepEqual([s1.start.offset, s1.end.offset], [3,4], 'offsets should have been shifted')
  // anno is inside
  doc = fixture(simple)
  s1 = doc.create({ type: 'strong', id: 's1', path: ["p1", "content"], startOffset: 3, endOffset: 4})
  documentHelpers.deleteTextRange(doc, { path, offset: 2 }, { path, offset: 5 })
  t.nil(doc.get('s1'), 'annotation should have been deleted')
  // anno.start between and anno.end after
  doc = fixture(simple)
  s1 = doc.create({ type: 'strong', id: 's1', path: ["p1", "content"], startOffset: 3, endOffset: 6})
  documentHelpers.deleteTextRange(doc, { path, offset: 2 }, { path, offset: 5 })
  t.deepEqual([s1.start.offset, s1.end.offset], [2,3], 'offsets should have been updated correctly')
  // anno.start same and anno.end after
  doc = fixture(simple)
  s1 = doc.create({ type: 'strong', id: 's1', path: ["p1", "content"], startOffset: 3, endOffset: 6})
  documentHelpers.deleteTextRange(doc, { path, offset: 3 }, { path, offset: 5 })
  t.deepEqual([s1.start.offset, s1.end.offset], [3,4], 'offsets should have been updated correctly')
  // anno.start before and anno.end between
  doc = fixture(simple)
  s1 = doc.create({ type: 'strong', id: 's1', path: ["p1", "content"], startOffset: 1, endOffset: 3})
  documentHelpers.deleteTextRange(doc, { path, offset: 2 }, { path, offset: 4 })
  t.deepEqual([s1.start.offset, s1.end.offset], [1,2], 'offsets should have been updated correctly')
  // anno.start before and anno.end after
  doc = fixture(simple)
  s1 = doc.create({ type: 'strong', id: 's1', path: ["p1", "content"], startOffset: 1, endOffset: 6})
  documentHelpers.deleteTextRange(doc, { path, offset: 2 }, { path, offset: 4 })
  t.deepEqual([s1.start.offset, s1.end.offset], [1,4], 'offsets should have been updated correctly')
  t.end()
})

test("deleteListRange()", (t) => {
  // first and last not entirely selected, and no item in between
  let doc = fixture(simple)
  ;[_l1, _l11, _l12, _l13].forEach(f=>f(doc, doc.get('body')))
  let l1 = doc.get('l1')
  documentHelpers.deleteListRange(doc, l1,
    { path: ['l1-1', 'content'], offset: 2 },
    { path: ['l1-2', 'content'], offset: 3 }
  )
  t.nil(doc.get('l1-2'), 'second list item should have been deleted')
  t.equal(doc.get('l1-1').getText(), LI1_TEXT.slice(0,2)+LI2_TEXT.slice(3), 'list items should have been merged')

  // item in between
  doc = fixture(simple)
  ;[_l1, _l11, _l12, _l13].forEach(f=>f(doc, doc.get('body')))
  l1 = doc.get('l1')
  documentHelpers.deleteListRange(doc, l1,
    { path: ['l1-1', 'content'], offset: 2 },
    { path: ['l1-3', 'content'], offset: 3 }
  )
  t.nil(doc.get('l1-2'), 'second list item should have been deleted')
  t.nil(doc.get('l1-3'), 'third list item should have been deleted')
  t.equal(doc.get('l1-1').getText(), LI1_TEXT.slice(0,2)+LI3_TEXT.slice(3), 'list items should have been merged')

  // entirely selected
  doc = fixture(simple)
  ;[_l1, _l11, _l12, _l13].forEach(f=>f(doc, doc.get('body')))
  l1 = doc.get('l1')
  documentHelpers.deleteListRange(doc, l1,
    { path: ['l1-1', 'content'], offset: 0 },
    { path: ['l1-3', 'content'], offset: LI3_TEXT }
  )
  t.nil(doc.get('l1-1'), 'first list item should have been deleted')
  t.nil(doc.get('l1-2'), 'second list item should have been deleted')
  t.nil(doc.get('l1-3'), 'third list item should have been deleted')

  t.end()
})

test("isContainerAnnotation()", (t) => {
  let doc = fixture(simple)
  t.ok(documentHelpers.isContainerAnnotation(doc, 'test-container-anno'))
  t.notOk(documentHelpers.isContainerAnnotation(doc, 'strong'))
  t.end()
})

test("Get container annotations for property selection", (t) => {
  let doc = fixture(containerAnnoSample)
  let sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  let annos
  // without options
  annos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, 'body')
  t.equal(annos.length, 1, 'There should be one container anno')
  // filtered by type
  annos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, 'body', {
    type: 'test-container-anno'
  })
  t.equal(annos.length, 1, 'There should be one container anno')
  t.end()
})

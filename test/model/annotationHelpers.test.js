import { module } from 'substance-test'

import annotationHelpers from '../../model/annotationHelpers'
import documentHelpers from '../../model/documentHelpers'
import EditingInterface from '../../model/EditingInterface'
import fixture from '../fixtures/createTestArticle'
import containerAnnoSample from '../fixtures/containerAnnoSample'

const test = module('model/annotationHelpers')

let truncateAnnotation = annotationHelpers.truncateAnnotation
let expandAnnotation = annotationHelpers.expandAnnotation
let fuseAnnotation = annotationHelpers.fuseAnnotation

test("Truncate property annotation with a given property selection", function(t) {
  let doc = fixture(containerAnnoSample)
  // Put cursor inside an the existing annotation
  let sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 2
  })
  let a2 = doc.get('a2')
  truncateAnnotation(doc, a2, sel)
  t.equal(a2.start.offset, 0, 'startOffset should be 0')
  t.equal(a2.end.offset, 1, 'endOffset should have changed from 2 to 1')
  t.end()
})

test("Truncate container annotation with a given property selection", function(t) {
  let doc = fixture(containerAnnoSample)
  let sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 1,
    endOffset: 4
  })
  let a1 = doc.get('a1')
  truncateAnnotation(doc, a1, sel)
  t.equal(a1.end.offset, 1, 'endOffset should be 1')
  t.end()
})

test("Truncate container annotation with a given container selection", function(t) {
  let doc = fixture(containerAnnoSample)
  let sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 4,
  })
  let a1 = doc.get('a1')
  truncateAnnotation(doc, a1, sel)
  t.deepEqual(a1.end.path, ['p2', 'content'], 'endPath should be p2.content')
  t.equal(a1.end.offset, 1, 'endOffset should be 1')
  t.end()
})

test("Expand-right of property annotation for a given property selection", function(t) {
  let doc = fixture(containerAnnoSample)
  let sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  let annos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel, { type: 'strong' })
  let anno = annos[0]
  expandAnnotation(doc, anno, sel)
  t.equal(anno.start.offset, 0, 'startOffset should be 0')
  t.equal(anno.end.offset, 6, 'endOffset should have changed from 2 to 1')
  t.end()
})

test("Expand container annotation for a given property selection (right expansion)", function(t) {
  let doc = fixture(containerAnnoSample)
  let sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  let anno = doc.get('a1')
  expandAnnotation(doc, anno, sel)
  t.equal(anno.end.offset, 6, 'endOffset should be 6')
  t.end()
})

test("Expand container annotation for a given container selection (expand right)", function(t) {
  let doc = fixture(containerAnnoSample)
  let sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 6,
  })
  let anno = doc.get('a1')
  expandAnnotation(doc, anno, sel)
  t.deepEqual(anno.end.path, ['p3', 'content'], 'endPath should be p2.content')
  t.equal(anno.end.offset, 6, 'endOffset should be 6')
  t.end()
})

test("Fuse two property annotations for a given property selection", function(t) {
  let tx = new EditingInterface(fixturePlus())
  // Put selection so that it touches both strong annotations
  tx.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  let a2 = tx.get('a2')
  let a3 = tx.get('a3')
  fuseAnnotation(tx, [a2, a3])
  t.isNil(tx.get('a3'), 'a3 should be gone.')
  t.equal(a2.start.offset, 0, 'startOffset should be 0')
  t.equal(a2.end.offset, 6, 'endOffset should be 6')
  t.end()
})

test("Fuse two conatiner annotations for a given property selection", function(t) {
  let tx = new EditingInterface(fixturePlus())
  tx.setSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 3,
    endOffset: 8
  })
  let a1 = tx.get('a1')
  let a4 = tx.get('a4')
  fuseAnnotation(tx, [a1, a4])
  t.isNil(tx.get('a4'), 'a4 should be gone.')
  t.deepEqual(a1.start.path, ['p1', 'content'], 'startPath should be p1.content')
  t.equal(a1.start.offset, 5, 'startOffset should be 5')
  t.deepEqual(a1.end.path, ['p4', 'content'], 'endPath should be p1.content')
  t.equal(a1.end.offset, 9, 'a1.end.offset should be 9')
  t.end()
})

function fixturePlus() {
  let doc = fixture(containerAnnoSample)
  // Create a second strong annotation to be fused
  doc.create({
    id: 'a3',
    type: 'strong',
    start: {
      path: ['p1', 'content'],
      offset: 4
    },
    end: {
      offset: 6
    }
  })
  // Create a second container annotation to be fused
  doc.create({
    type: 'test-container-anno',
    id: 'a4',
    containerId: 'body',
    start: {
      path: ['p3', 'content'],
      offset: 7,
    },
    end: {
      path: ['p4', 'content'],
      offset: 9,
    }
  })
  return doc
}

import { module } from 'substance-test'

import annotationHelpers from '../../model/annotationHelpers'
import documentHelpers from '../../model/documentHelpers'
import fixture from '../fixtures/createTestArticle'
import containerAnnoSample from '../fixtures/containerAnnoSample'

const test = module('model/annotationHelpers')

let truncateAnnotation = annotationHelpers.truncateAnnotation
let expandAnnotation = annotationHelpers.expandAnnotation
let fuseAnnotation = annotationHelpers.fuseAnnotation

test("Truncate property annotation with a given property selection", function(t) {
  var doc = fixture(containerAnnoSample)
  // Put cursor inside an the existing annotation
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 2
  })
  var a2 = doc.get('a2')
  truncateAnnotation(doc, a2, sel)
  t.equal(a2.startOffset, 0, 'startOffset should be 0')
  t.equal(a2.endOffset, 1, 'endOffset should have changed from 2 to 1')
  t.end()
})

test("Truncate container annotation with a given property selection", function(t) {
  var doc = fixture(containerAnnoSample)
  var sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 1,
    endOffset: 4
  })
  var a1 = doc.get('a1')
  truncateAnnotation(doc, a1, sel)
  t.equal(a1.endOffset, 1, 'endOffset should be 1')
  t.end()
})

test("Truncate container annotation with a given container selection", function(t) {
  var doc = fixture(containerAnnoSample)
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 4,
  })
  var a1 = doc.get('a1')
  truncateAnnotation(doc, a1, sel)
  t.deepEqual(a1.endPath, ['p2', 'content'], 'endPath should be p2.content')
  t.equal(a1.endOffset, 1, 'endOffset should be 1')
  t.end()
})

test("Expand-right of property annotation for a given property selection", function(t) {
  var doc = fixture(containerAnnoSample)
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  var annos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel, { type: 'strong' })
  let anno = annos[0]
  expandAnnotation(doc, anno, sel)
  t.equal(anno.startOffset, 0, 'startOffset should be 0')
  t.equal(anno.endOffset, 6, 'endOffset should have changed from 2 to 1')
  t.end()
})

test("Expand container annotation for a given property selection (right expansion)", function(t) {
  var doc = fixture(containerAnnoSample)
  var sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  var anno = doc.get('a1')
  expandAnnotation(doc, anno, sel)
  t.equal(anno.endOffset, 6, 'endOffset should be 6')
  t.end()
})

test("Expand container annotation for a given container selection (expand right)", function(t) {
  var doc = fixture(containerAnnoSample)
  var sel = doc.createSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p2', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 6,
  })
  var anno = doc.get('a1')
  expandAnnotation(doc, anno, sel)
  t.deepEqual(anno.endPath, ['p3', 'content'], 'endPath should be p2.content')
  t.equal(anno.endOffset, 6, 'endOffset should be 6')
  t.end()
})

function fixturePlus() {
  var doc = fixture(containerAnnoSample)
  // Create a second strong annotation to be fused
  doc.create({
    id: 'a3',
    type: 'strong',
    path: ['p1', 'content'],
    startOffset: 4,
    endOffset: 6
  })

  // Create a second container annotation to be fused
  doc.create({
    type: 'test-container-anno',
    id: 'a4',
    containerId: 'body',
    startPath: ['p3', 'content'],
    startOffset: 7,
    endPath: ['p4', 'content'],
    endOffset: 9,
  })
  return doc
}

test("Fuse two property annotations for a given property selection", function(t) {
  var doc = fixturePlus()
  // Put selection so that it touches both strong annotations
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  var annos = documentHelpers.getPropertyAnnotationsForSelection(doc, sel, { type: 'strong' })
  t.ok(annos.length, 2, 'Should have a 2 strong annos in fixture')
  fuseAnnotation(doc, annos)
  t.isNil(doc.get('a3'), 'a3 should be gone.')
  let a2 = doc.get('a2')
  t.equal(a2.startOffset, 0, 'startOffset should be 0')
  t.equal(a2.endOffset, 6, 'endOffset should be 6')
  t.end()
})

test("Fuse two conatiner annotations for a given property selection", function(t) {
  var doc = fixturePlus()
  var sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 3,
    endOffset: 8
  })
  var annos = documentHelpers.getContainerAnnotationsForSelection(doc, sel, 'body', {
    type: 'test-container-anno'
  })
  t.equal(annos.length, 2, 'There should be two container annotations for this selection.')
  fuseAnnotation(doc, annos)
  let a1 = doc.get('a1')
  t.isNil(doc.get('a4'), 'a4 should be gone.')
  t.deepEqual(a1.startPath, ['p1', 'content'], 'startPath should be p1.content')
  t.equal(a1.startOffset, 5, 'startOffset should be 5')
  t.deepEqual(a1.endPath, ['p4', 'content'], 'endPath should be p1.content')
  t.equal(a1.endOffset, 9, 'a1.endOffset should be 9')
  t.end()
})

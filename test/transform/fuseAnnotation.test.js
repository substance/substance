import { module } from 'substance-test'
import fuseAnnotation from '../../model/transform/fuseAnnotation'
import docHelpers from '../../model/documentHelpers'
import createTestArticle from '../fixtures/createTestArticle'
import containerAnnoSample from '../fixtures/containerAnnoSample'

const test = module('transform/fuseAnnotation')

function fixture() {
  var doc = createTestArticle(containerAnnoSample)

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
  var doc = fixture()

  // a2: strong -> p1.content [0..2]
  t.ok(doc.get('a2'), 'Should have a strong annotation a2 in fixture')

  // Put selection so that it touches both strong annotations
  var sel = doc.createSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 1,
    endOffset: 6
  })
  var annos = docHelpers.getPropertyAnnotationsForSelection(doc, sel, { type: 'strong' })

  // Prepare and perform transformation
  var out = fuseAnnotation(doc, { annos: annos })
  var fusedAnno = out.result

  t.isNil(doc.get('a2'), 'a2 should be gone.')
  t.isNil(doc.get('a3'), 'a3 should be gone.')
  t.ok(fusedAnno, 'fusedAnno should have been returned as a result')

  t.equal(fusedAnno.startOffset, 0, 'fusedAnno.startOffset should be 0')
  t.equal(fusedAnno.endOffset, 6, 'fusedAnno.endOffset should be 6')
  t.end()
})

test("Fuse two conatiner annotations for a given property selection", function(t) {
  var doc = fixture()
  var sel = doc.createSelection({
    type: 'property',
    path: ['p3', 'content'],
    startOffset: 3,
    endOffset: 8
  })
  var annos = docHelpers.getContainerAnnotationsForSelection(doc, sel, 'body', {
    type: 'test-container-anno'
  })
  t.equal(annos.length, 2, 'There should be two container annotations for this selection.')

  var out = fuseAnnotation(doc, {
    annos: annos
  })
  var fusedAnno = out.result

  t.notNil(fusedAnno, 'fusedAnno should have been returned as a result of transformation')
  t.isNil(doc.get('a1'), 'a1 should be gone.')
  t.isNil(doc.get('a4'), 'a4 should be gone.')

  t.deepEqual(fusedAnno.startPath, ['p1', 'content'], 'a1.startPath should be p1.content')
  t.equal(fusedAnno.startOffset, 5, 'fusedAnno.startOffset should be 5')

  t.deepEqual(fusedAnno.endPath, ['p4', 'content'], 'a1.startPath should be p1.content')
  t.equal(fusedAnno.endOffset, 9, 'fusedAnno.endOffset should be 9')
  t.end()
})


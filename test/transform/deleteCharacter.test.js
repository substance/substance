import { module } from 'substance-test'
import fixture from '../fixtures/createTestArticle'
import headersAndParagraphs from '../fixtures/headersAndParagraphs'
import deleteCharacter from '../../model/transform/deleteCharacter'

const test = module('transform/deleteCharacter')

test("Backspacing", function(t) {
  var doc = fixture(headersAndParagraphs)
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 4
  })
  var args = {selection: sel, direction: 'left'}
  deleteCharacter(doc, args)
  t.equal(doc.get(['p2', 'content']), 'Pargraph with annotation', 'Character should be deleted.')
  t.end()
})

test("Deleting a character", function(t) {
  var doc = fixture(headersAndParagraphs)
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 4
  })
  var args = {selection: sel, direction: 'right'}
  deleteCharacter(doc, args)
  t.equal(doc.get(['p2', 'content']), 'Pararaph with annotation', 'Character should be deleted.')
  t.end()
})

test("Backspacing into previous component", function(t) {
  var doc = fixture(headersAndParagraphs)
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 0
  })
  var args = {selection: sel, containerId: 'body', direction: 'left'}
  var out = deleteCharacter(doc, args)
  var selection = out.selection
  t.equal(doc.get(['h2', 'content']), 'Section 2Paragraph with annotation', 'Content of p2 should have been merged into h2.')
  t.isNil(doc.get('p2'), 'p2 should be gone.')
  t.ok(selection.isCollapsed(), 'Selection should be collapsed.')
  t.equal(selection.startOffset, 9, 'Cursor should be before the first character of the merged text.')
  t.end()
})

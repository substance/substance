// Fixture for documentStore
import JSONConverter from '../../model/JSONConverter'
import EditingInterface from '../../model/EditingInterface'
import createTestArticle from './createTestArticle'
import twoParagraphs from './twoParagraphs'
var converter = new JSONConverter()

// Serializes to JSON
function build(doc, documentId, version) {
  return {
    documentId: documentId,
    data: converter.exportDocument(doc),
    version: version,
  }
}

var doc = createTestArticle(twoParagraphs)
var tx = new EditingInterface(doc)

var doc1V1 = build(doc, 'test-doc', 1)
var doc2V1 = build(doc, 'test-doc-2', 1)

tx.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 1 })
tx.insertText('!')
tx.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 3 })
tx.insertText('???')
var doc2V3 = build(doc, 'test-doc-2', 3)

export default {
  'test-doc': {
    1: doc1V1
  },
  'test-doc-2': {
    1: doc2V1,
    3: doc2V3
  }
}

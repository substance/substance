// Fixture for documentStore
import DocumentSession from '../../model/DocumentSession'
import JSONConverter from '../../model/JSONConverter'
import createTestArticle from './createTestArticle'
import twoParagraphs from './twoParagraphs'
import insertText from './insertText'
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
var documentSession = new DocumentSession(doc)

var doc1V1 = build(doc, 'test-doc', 1)
var doc2V1 = build(doc, 'test-doc-2', 1)
documentSession.transaction(function(tx) {
  insertText(tx, {
    path: ['p1', 'content'],
    pos: 1,
    text: '!'
  })
})
documentSession.transaction(function(tx) {
  insertText(tx, {
    path: ['p1', 'content'],
    pos: 3,
    text: '???'
  })
})
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

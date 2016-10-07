import createTestArticle from './createTestArticle'
import createChangeset from './createChangeset'

export default function createTestDocumentFactory() {
  return {
    createDocument: function() {
      return createTestArticle()
    },
    createChangeset: function() {
      var doc = createTestArticle()
      return createChangeset(doc)
    }
  }
}

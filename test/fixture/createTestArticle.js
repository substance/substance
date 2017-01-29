import TestArticle from './TestArticle'

export default function createTestArticle(seedFn) {
  var doc = new TestArticle()
  if (seedFn) {
    seedFn(doc)
  }
  return doc
}

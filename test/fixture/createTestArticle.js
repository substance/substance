import TestArticle from './TestArticle'
import getTestConfig from './getTestConfig'

export default function createTestArticle(seedFn) {
  let config = getTestConfig()
  var doc = new TestArticle(config.getSchema())
  if (seedFn) {
    seedFn(doc)
  }
  return doc
}

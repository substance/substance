import { DocumentSchema } from 'substance'
import TestArticle from './TestArticle'
import getTestConfig from './getTestConfig'

export default function createTestArticle (seedFn) {
  let config = getTestConfig()
  let schema = new DocumentSchema({
    DocumentClass: TestArticle,
    nodes: config.getNodes(),
    // TODO: try to get rid of this by using property schema
    defaultTextType: 'paragraph'
  })
  let doc = TestArticle.createEmptyTestArticle(schema)
  if (seedFn) {
    seedFn(doc)
  }
  return doc
}

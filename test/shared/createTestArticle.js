import { DocumentSchema } from 'substance'
import TestArticle from './TestArticle'
import getTestConfig from './getTestConfig'

export default function createTestArticle (seedFn) {
  const config = getTestConfig()
  const schema = new DocumentSchema({
    DocumentClass: TestArticle,
    nodes: config.getNodes()
  })
  const doc = TestArticle.createEmptyTestArticle(schema)
  if (seedFn) {
    seedFn(doc)
  }
  return doc
}

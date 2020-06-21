import { DocumentSchema } from 'substance'
import getTestConfig from './getTestConfig'
import TestArticle from './TestArticle'

export default function getTestSchema () {
  const config = getTestConfig()
  const schema = new DocumentSchema({
    DocumentClass: TestArticle,
    nodes: config.getNodes()
  })
  return schema
}

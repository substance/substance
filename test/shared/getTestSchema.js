import { DocumentSchema } from 'substance'
import getTestConfig from './getTestConfig'
import TestArticle from './TestArticle'

export default function getTestSchema () {
  let config = getTestConfig()
  let schema = new DocumentSchema({
    DocumentClass: TestArticle,
    nodes: config.getNodes(),
    // TODO: try to get rid of this by using property schema
    defaultTextType: 'paragraph'
  })
  return schema
}

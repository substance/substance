import { Document } from 'substance'

export default class TestArticle extends Document {
  static createEmptyTestArticle (schema) {
    let doc = new TestArticle(schema)
    doc.create({
      type: 'body',
      id: 'body',
      nodes: []
    })
    return doc
  }
}

import { Document } from 'substance'

class TestArticle extends Document {
  constructor (schema) {
    super(schema)
    this.create({
      type: 'container',
      id: 'body',
      nodes: []
    })
  }
}

export default TestArticle

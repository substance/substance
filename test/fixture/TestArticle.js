import Document from '../../model/Document'

class TestArticle extends Document {

  constructor(schema) {
    super(schema)

    this.create({
      type: "meta",
      id: "meta",
      title: 'Untitled'
    })
    this.create({
      type: "container",
      id: "body",
      nodes: []
    })
  }

  getDocumentMeta() {
    return this.get('meta')
  }
}

export default TestArticle

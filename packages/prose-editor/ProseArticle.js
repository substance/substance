import Document from '../../model/Document'

export default
class ProseArticle extends Document {

  _initialize() {
    super._initialize()

    this.create({
      type: 'container',
      id: 'body',
      nodes: []
    })
  }

}

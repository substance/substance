import { Document } from '../../model'

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

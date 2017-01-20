import HTMLImporter from '../../model/HTMLImporter'
import ProseArticle from './ProseArticle'
const schema = ProseArticle.schema

// TODO: FIX this. Should be used together with configurator
class ProseArticleImporter extends HTMLImporter {
  constructor() {
    super({
      schema: schema,
      converters: ProseArticleImporter.converters,
      DocumentClass: ProseArticle
    })
  }

  /*
    Takes an HTML string.
  */
  convertDocument(bodyEls) {
    // Just to make sure we always get an array of elements
    if (!bodyEls.length) bodyEls = [bodyEls]
    this.convertContainer(bodyEls, 'body')
  }
}

ProseArticleImporter.converters = []

export default ProseArticleImporter

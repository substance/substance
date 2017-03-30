import { HTMLImporter } from '../../model'
import ProseArticle from './ProseArticle'

// TODO: FIX this. Should be used together with configurator
class ProseArticleImporter extends HTMLImporter {
  constructor() {
    super({
      schema: ProseArticle.schema,
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

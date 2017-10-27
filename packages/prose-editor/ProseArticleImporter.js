import { HTMLImporter } from '../../model'

// TODO: FIX this. Should be used together with configurator
export default class ProseArticleImporter extends HTMLImporter {

  convertDocument(documentEl) {
    let body = documentEl.find('body')
    this.convertContainer(body.children, 'body')
  }

}
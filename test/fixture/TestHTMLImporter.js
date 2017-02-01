import HTMLImporter from '../../model/HTMLImporter'
import ParagraphHTMLConverter from '../../packages/paragraph/ParagraphHTMLConverter'
import HeadingHTMLConverter from '../../packages/heading/HeadingHTMLConverter'
import EmphasisHTMLConverter from '../../packages/emphasis/EmphasisHTMLConverter'
import StrongHTMLConverter from '../../packages/strong/StrongHTMLConverter'
import LinkHTMLConverter from '../../packages/link/LinkHTMLConverter'
import ListHTMLConverter from '../../packages/list/ListHTMLConverter'
import ListItemHTMLConverter from '../../packages/list/ListItemHTMLConverter'
import schema from './TestSchema'
import TestArticle from './TestArticle'

const CONVERTERS = [
  ParagraphHTMLConverter, HeadingHTMLConverter, EmphasisHTMLConverter,
  StrongHTMLConverter, LinkHTMLConverter,
  ListHTMLConverter, ListItemHTMLConverter
]

class TestHTMLImporter extends HTMLImporter {

  constructor(standAlone) {
    super({
      schema: schema,
      converters: CONVERTERS,
      DocumentClass: TestArticle,
      "stand-alone": Boolean(standAlone)
    })
  }

  convertDocument(documentEl) {
    this.state.doc = this.createDocument()
    var bodyEl = documentEl.find('body')
    this.convertContainer(bodyEl.children, 'body')
  }

}

TestHTMLImporter.converters = CONVERTERS

export default TestHTMLImporter

import BasePackage from '../base/BasePackage'
import SwitchTextTypePackage from '../switch-text-type/SwitchTextTypePackage'
import ParagraphPackage from '../paragraph/ParagraphPackage'
import HeadingPackage from '../heading/HeadingPackage'
import CodeblockPackage from '../codeblock/CodeblockPackage'
import BlockquotePackage from '../blockquote/BlockquotePackage'
import LinkPackage from '../link/LinkPackage'
import EmphasisPackage from '../emphasis/EmphasisPackage'
import StrongPackage from '../strong/StrongPackage'
import CodePackage from '../code/CodePackage'
import SubscriptPackage from '../subscript/SubscriptPackage'
import SuperscriptPackage from '../superscript/SuperscriptPackage'
import QuoteMarksPackage from '../quote-marks/QuoteMarksPackage'
import ListPackage from '../list/ListPackage'
import TablePackage from '../table/TablePackage'
import ProseArticle from './ProseArticle'

export default {
  name: 'prose-editor',
  configure: function(config) {
    config.defineSchema({
      name: 'prose-article',
      ArticleClass: ProseArticle,
      defaultTextType: 'paragraph'
    })
    // SwitchTextType, Undo/Redo etc.
    config.import(BasePackage)
    config.import(SwitchTextTypePackage)
    config.import(ParagraphPackage)
    config.import(HeadingPackage)
    config.import(CodeblockPackage)
    config.import(BlockquotePackage)
    config.import(EmphasisPackage)
    config.import(StrongPackage)
    config.import(SubscriptPackage)
    config.import(SuperscriptPackage)
    config.import(CodePackage)
    config.import(LinkPackage)
    config.import(QuoteMarksPackage)
    config.import(ListPackage)
    config.import(TablePackage)
  }
}

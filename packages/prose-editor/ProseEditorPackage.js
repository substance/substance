import BasePackage from '../base/BasePackage'
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
import FindAndReplacePackage from '../find-and-replace/FindAndReplacePackage'
import ListPackage from '../list/ListPackage'
import TablePackage from '../table/TablePackage'
import ProseArticle from './ProseArticle'
import ProseEditor from './ProseEditor'

export default {
  name: 'prose-editor',
  configure: function(config) {
    config.defineSchema({
      name: 'prose-article',
      DocumentClass: ProseArticle,
      defaultTextType: 'paragraph'
    })
    // Undo/Redo etc.
    config.import(BasePackage)
    config.import(BlockquotePackage)
    config.import(ParagraphPackage)
    config.import(HeadingPackage)
    config.import(CodeblockPackage)
    config.import(CodePackage)
    config.import(EmphasisPackage)
    config.import(FindAndReplacePackage, {
      targetSurfaces: ['body']
    })
    config.import(StrongPackage)
    config.import(SubscriptPackage)
    config.import(SuperscriptPackage)
    config.import(LinkPackage)
    config.import(QuoteMarksPackage)
    config.import(ListPackage)
    config.import(TablePackage)

    // Configure overlay
    config.addToolPanel('main-overlay', [
      {
        name: 'prompt',
        type: 'tool-group',
        commandGroups: ['prompt']
      }
    ])

    config.addToolPanel('workflow', [
      {
        name: 'workflow',
        type: 'tool-group',
        commandGroups: ['workflows']
      }
    ])

    // Configure toolbar
    config.addToolPanel('toolbar', [
      {
        name: 'text-types',
        type: 'tool-dropdown',
        showDisabled: true,
        style: 'descriptive',
        commandGroups: ['text-types']
      },
      {
        name: 'annotations',
        type: 'tool-group',
        showDisabled: true,
        style: 'minimal',
        commandGroups: ['annotations']
      },
      {
        name: 'insert',
        type: 'tool-dropdown',
        showDisabled: true,
        style: 'descriptive',
        commandGroups: ['insert']
      }
    ])
  },
  ProseEditor,
  ProseArticle
}

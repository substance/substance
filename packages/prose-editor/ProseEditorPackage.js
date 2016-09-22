// Base packages
import BasePackage from '../base/BasePackage'
import ParagraphPackage from '../paragraph/ParagraphPackage'
import HeadingPackage from '../heading/HeadingPackage'
import CodeblockPackage from '../codeblock/CodeblockPackage'
import BlockquotePackage from '../blockquote/BlockquotePackage'
import ListPackage from '../list/ListPackage'
import LinkPackage from '../link/LinkPackage'
import EmphasisPackage from '../emphasis/EmphasisPackage'
import StrongPackage from '../strong/StrongPackage'
import CodePackage from '../code/CodePackage'
import SubscriptPackage from '../subscript/SubscriptPackage'
import SuperscriptPackage from '../superscript/SuperscriptPackage'

import ProseArticle from './ProseArticle'
import ProseEditor from './ProseEditor'
import ProseEditorConfigurator from './ProseEditorConfigurator'
import Toolbar from '../tools/Toolbar'


export default {
  name: 'prose-editor',
  configure: function(config, options) {
    config.defineSchema({
      name: 'prose-article',
      ArticleClass: ProseArticle,
      defaultTextType: 'paragraph'
    });
    // Now import base packages
    config.import(BasePackage, {
      noBaseStyles: options.noBaseStyles
    });

    config.import(ParagraphPackage);
    config.import(HeadingPackage);
    config.import(CodeblockPackage);
    config.import(BlockquotePackage);
    config.import(ListPackage);
    config.import(EmphasisPackage);
    config.import(StrongPackage);
    config.import(SubscriptPackage);
    config.import(SuperscriptPackage);
    config.import(CodePackage);
    config.import(LinkPackage);
  },
  ProseEditor: ProseEditor,
  Configurator: ProseEditorConfigurator,
  Toolbar: Toolbar
};

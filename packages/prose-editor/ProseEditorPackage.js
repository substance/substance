'use strict';

// Base packages
var BasePackage = require('../base/BasePackage');
var ParagraphPackage = require('../paragraph/ParagraphPackage');
var HeadingPackage = require('../heading/HeadingPackage');
var CodeblockPackage = require('../codeblock/CodeblockPackage');
var BlockquotePackage = require('../blockquote/BlockquotePackage');
var ListPackage = require('../list/ListPackage');
var LinkPackage = require('../link/LinkPackage');
var EmphasisPackage = require('../emphasis/EmphasisPackage');
var StrongPackage = require('../strong/StrongPackage');
var CodePackage = require('../code/CodePackage');
var SubscriptPackage = require('../subscript/SubscriptPackage');
var SuperscriptPackage = require('../superscript/SuperscriptPackage');
var ProseEditorToolbar = require('./ProseEditorToolbar');
var Overlay = require('../../ui/Overlay');

// Article Class
var ProseArticle = require('./ProseArticle');

module.exports = {
  name: 'prose-editor',
  configure: function(config, options) {
    config.defineSchema({
      name: 'prose-article',
      ArticleClass: ProseArticle,
      defaultTextType: 'paragraph'
    });
    config.setToolbarClass(ProseEditorToolbar);
    config.addComponent('overlay', Overlay);
    // Now import base packages
    config.import(BasePackage, {
      noBaseStyles: options.noBaseStyles
    });

    config.addStyle(__dirname, '_prose-editor.scss');
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
  }
};
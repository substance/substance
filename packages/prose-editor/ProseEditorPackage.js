'use strict';

// Base commands
var UndoCommand = require('../../ui/UndoCommand');
var RedoCommand = require('../../ui/RedoCommand');
var SaveCommand = require('../../ui/SaveCommand');

// Base Tools
var SwitchTextTypeCommand = require('../text/SwitchTextTypeCommand');
var SwitchTextTypeTool = require('../text/SwitchTextTypeTool');
var UndoTool = require('../../ui/UndoTool');
var RedoTool = require('../../ui/RedoTool');

// Base packages
var ParagraphPackage = require('../paragraph/ParagraphPackage');
var HeadingPackage = require('../heading/HeadingPackage');
var CodeblockPackage = require('../codeblock/CodeblockPackage');
var BlockquotePackage = require('../blockquote/BlockquotePackage');
var LinkPackage = require('../link/LinkPackage');
var EmphasisPackage = require('../emphasis/EmphasisPackage');
var StrongPackage = require('../strong/StrongPackage');

// Article Class
var ProseArticle = require('./ProseArticle');

module.exports = {
  name: 'prose-editor',
  configure: function(config) {
    config.defineSchema({
      name: 'prose-article',
      ArticleClass: ProseArticle,
      defaultTextType: 'paragraph'
    });

    // Setup base functionality
    config.addCommand(UndoCommand);
    config.addCommand(RedoCommand);
    config.addCommand(SwitchTextTypeCommand);

    config.addTool(SwitchTextTypeTool);
    config.addTool(UndoTool);
    config.addTool(RedoTool);

    // Now import base packages
    config.import(ParagraphPackage);
    config.import(HeadingPackage);
    config.import(CodeblockPackage);
    config.import(BlockquotePackage);
    config.import(EmphasisPackage);
    config.import(StrongPackage);
    config.import(LinkPackage);
  }
};
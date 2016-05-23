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
var Codeblock = require('../codeblock/CodeblockPackage');
var Blockquote = require('../blockquote/BlockquotePackage');
var LinkPackage = require('../link/LinkPackage');
var EmphasisPackage = require('../emphasis/EmphasisPackage');
var StrongPackage = require('../strong/StrongPackage');

module.exports = function(config) {
  // Setup base functionality
  config.addCommand(UndoCommand);
  config.addCommand(RedoCommand);
  config.addCommand(SaveCommand);
  config.addCommand(SwitchTextTypeCommand);

  config.addTool(SwitchTextTypeTool);
  config.addTool(UndoTool, {icon: 'fa-undo'});
  config.addTool(RedoTool, {icon: 'fa-repeat'});

  // Now import base packages
  config.import(ParagraphPackage);
  config.import(HeadingPackage);
  config.import(Codeblock);
  config.import(Blockquote);
  config.import(EmphasisPackage);
  config.import(StrongPackage);
  config.import(LinkPackage);
};
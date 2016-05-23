'use strict';

var ParagraphPackage = require('../paragraph/ParagraphPackage');
// Core commands
var UndoCommand = require('../../ui/UndoCommand');
var RedoCommand = require('../../ui/RedoCommand');
var SaveCommand = require('../../ui/SaveCommand');

// Core Tools
var SwitchTextTypeCommand = require('../text/SwitchTextTypeCommand');
var SwitchTextTypeTool = require('../text/SwitchTextTypeTool');
var UndoTool = require('../../ui/UndoTool');
var RedoTool = require('../../ui/RedoTool');

// Core packages
var HeadingPackage = require('../heading/HeadingPackage');
var LinkPackage = require('../link/LinkPackage');
// var Codeblock = require('substance/packages/codeblock');
// var Blockquote = require('substance/packages/blockquote');
var EmphasisPackage = require('../emphasis/EmphasisPackage');

module.exports = function(config) {

  // Setup base functionality
  config.addCommand(UndoCommand);
  config.addCommand(RedoCommand);
  config.addCommand(SaveCommand);
  config.addCommand(SwitchTextTypeCommand);

  config.addTool(SwitchTextTypeTool);
  config.addTool(UndoTool, {icon: 'fa-undo'});
  config.addTool(RedoTool, {icon: 'fa-repeat'});

  // Now import core modules
  config.import(ParagraphPackage);
  config.import(HeadingPackage);
  config.import(EmphasisPackage);
  config.import(LinkPackage);

  // config.import(Codeblock);
  // config.import(Blockquote);
};
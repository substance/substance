"use strict";

var Component = require('../component');
var $$ = Component.$$;

var Icon = require('../font_awesome_icon');

var UndoTool = require('../tools/undo_tool');
var RedoTool = require('../tools/redo_tool');
var TextTool = require('../tools/text_tool');
var StrongTool = require('../tools/strong_tool');
var EmphasisTool = require('../tools/emphasis_tool');
var LinkTool = require('../tools/link_tool');



var DefaultToolbar = Component.extend({
  displayName: "DefaultToolbar",

  render: function() {
    var el = $$('div').addClass('toolbar');
    el.append(
      $$(TextTool, {'title': 'Switch text'}),
      $$(UndoTool).append($$(Icon, {icon: "fa-undo"})),
      $$(RedoTool).append($$(Icon, {icon: "fa-repeat"})),
      $$(StrongTool).append($$(Icon, {icon: "fa-bold"})),
      $$(EmphasisTool).append($$(Icon, {icon: "fa-italic"})),
      $$(LinkTool).append($$(Icon, {icon: "fa-link"}))
    );
    return el;
  }
});

module.exports = DefaultToolbar;
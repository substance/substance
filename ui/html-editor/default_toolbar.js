"use strict";

var Component = require('../component');
var $$ = Component.$$;

var Tool = require('../tools/tool_component');
var TextTool = require('../tools/text_tool_component');
var Icon = require('../font_awesome_icon');

var DefaultToolbar = Component.extend({

  render: function() {
    var el = $$("div").addClass("default-html-toolbar toolbar small fill-white");
    el.append(
      $$('div').addClass('tool-group text clearfix').append(
        $$(TextTool).addProps({ tool: 'text', title: 'Switch type'})
      )
    );
    el.append(
      $$('div').addClass('tool-group document clearfix').append(
        $$(Tool)
          .addClass('button tool')
          .addProps({ tool: 'undo', title: 'Undo' })
          .append($$(Icon).addProps({icon: "fa-undo"})),
        $$(Tool)
          .addClass('button tool')
          .addProps({ tool: 'redo', title: 'Redo'})
          .append($$(Icon).addProps({icon: "fa-repeat"}))
      )
    );

    el.append(
      $$('div').addClass('tool-group formatting clearfix float-right').append(
        $$(Tool)
          .addClass('button tool')
          .addProps({ tool: 'emphasis', title: 'Emphasis'})
          .append($$(Icon).addProps({icon: "fa-italic"})),
        $$(Tool)
          .addClass('button tool')
          .addProps({ tool: 'strong', title: 'Strong' })
          .append($$(Icon).addProps({icon: "fa-bold"}))
      )
    );
    return el;
  },
});

module.exports = DefaultToolbar;


"use strict";

var Component = require('../component');
var $$ = Component.$$;

var ToolComponent = require('../tools/tool_component');
var TextToolComponent = require('../tools/text_tool_component');
var LinkToolComponent = require('../tools/link_tool_component');
var Icon = require('../font_awesome_icon');

var DefaultToolbar = Component.extend({

  displayName: "DefaultToolbar",

  render: function() {
    var el = $$('div').addClass('toolbar');
    el.append(
      $$(TextToolComponent, { tool: 'text', 'title': 'Switch text'}),
      $$(ToolComponent, {tool: 'undo', 'title': 'Undo'})
        .append($$(Icon, {icon: "fa-undo"})),
      $$(ToolComponent, {tool: 'redo', 'title': 'Redo'})
        .append($$(Icon, {icon: "fa-repeat"})),
      $$(ToolComponent).addProps({tool: 'emphasis', 'title': 'Emphasis'})
        .append($$(Icon).addProps({icon: "fa-italic"})),
      $$(ToolComponent).addProps({tool: 'strong', 'title': 'Strong'})
        .append($$(Icon).addProps({icon: "fa-bold"})),
      $$(LinkToolComponent).addProps({
        tool: 'link',
        'title': 'Link',
        children: [$$(Icon).addProps({icon: "fa-link"})]
      }).addClass('tool')
    );
    return el;
  }
});

module.exports = DefaultToolbar;
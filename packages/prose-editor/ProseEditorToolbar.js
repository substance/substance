'use strict';

var Component = require('../../ui/Component');
var ToolGroup = require('../../ui/ToolGroup');

function ProseEditorToolbar() {
  Component.apply(this, arguments);
}

ProseEditorToolbar.Prototype = function() {

  this.render = function($$) {
    var el = $$("div").addClass('sc-prose-editor-toolbar');
    var commandStates = this.props.commandStates;
    var toolRegistry = this.context.toolRegistry;

    var tools = [];
    toolRegistry.forEach(function(tool, name) {
      if (!tool.options.overlay) {
        tools.push(
          $$(tool.Class, commandStates[name])
        );
      }
    });

    el.append(
      $$(ToolGroup).append(tools)
    );
    return el;
  };
};

Component.extend(ProseEditorToolbar);
module.exports = ProseEditorToolbar;

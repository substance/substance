'use strict';

var Component = require('../../ui/Component');

function ProseEditorOverlay() {
  Component.apply(this, arguments);
}

ProseEditorOverlay.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass('sc-prose-editor-overlay');
    var commandStates = this.props.commandStates;
    var toolRegistry = this.context.toolRegistry;
    
    toolRegistry.each(function(tool, name) {
      if (tool.options.overlay) {
        var toolProps = tool.Class.static.getProps(commandStates);
        if (toolProps) {
          el.append(
            $$(tool.Class, toolProps)
          );
        }
      }
    });
    return el;
  };
};

Component.extend(ProseEditorOverlay);

module.exports = ProseEditorOverlay;

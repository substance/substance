'use strict';

var Component = require('../../ui/Component');
var clone = require('lodash/clone');

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
        // HACK: the command state inspection is not really generic
        var commandName = tool.Class.static.commandName;
        if (commandStates[commandName].mode === 'edit') {
          // TODO: Remove clone hack once #577 is fixed
          el.append(
            $$(tool.Class, clone(commandStates[commandName]))
          );
        }
      }
    });
    return el;
  };
};

Component.extend(ProseEditorOverlay);

module.exports = ProseEditorOverlay;

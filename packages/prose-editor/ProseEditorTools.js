'use strict';

var Toolbar = require('../../ui/Toolbar');
var Icon = require('../../ui/FontAwesomeIcon');
var clone = require('lodash/clone');
var UndoTool = require('../../ui/UndoTool');
var RedoTool = require('../../ui/RedoTool');
var SwitchTextTypeTool = require('../../packages/text/SwitchTextTypeTool');
var StrongTool = require('../../packages/strong/StrongTool');
var EmphasisTool = require('../../packages/emphasis/EmphasisTool');
var LinkTool = require('../../packages/link/LinkTool');
var EditLinkTool = require('../../packages/link/EditLinkTool');

function ProseEditorTools() {
  Toolbar.apply(this, arguments);
}

ProseEditorTools.Prototype = function() {

  this.render = function($$) {
    var el = $$("div").addClass('sc-example-toolbar');
    var commandStates = this.props.commandStates;
    var config = this.context.config;

    // TODO: Remove clone hack once #577 is fixed
    var tools = [
      $$(SwitchTextTypeTool, clone(commandStates['switch-text-type'])),
      $$(UndoTool, clone(commandStates.undo)).append($$(Icon, {icon: 'fa-undo'})),
      $$(RedoTool, clone(commandStates.redo)).append($$(Icon, {icon: 'fa-repeat'})),
      $$(StrongTool, clone(commandStates.strong)).append($$(Icon, {icon: 'fa-bold'})),
      $$(EmphasisTool, clone(commandStates.emphasis)).append($$(Icon, {icon: 'fa-italic'})),
      $$(LinkTool, clone(commandStates.link)).append($$(Icon, {icon: 'fa-link'}))
    ];

    if (config.tools) {
      config.tools.forEach(function(tool) {
        tools.push(
          $$(tool.component, clone(commandStates[tool.commandName])).append(
            $$(Icon, {icon: tool.icon})
          )
        );
      });
    }

    if (commandStates['link'].mode === 'edit') {
      tools.push(
        $$(EditLinkTool, clone(commandStates.link))
      );
    }

    if (this.props.tools) {
      tools = tools.concat(this.props.tools);
    }

    el.append(
      $$(Toolbar.Group).append(
        tools
      )
    );


    return el;
  };
};

Toolbar.extend(ProseEditorTools);

module.exports = ProseEditorTools;

'use strict';

var Component = require('../../ui/Component');
var Toolbar = require('../../ui/Toolbar');
var Icon = require('../../ui/FontAwesomeIcon');
var clone = require('lodash/clone');

function ProseEditorTools() {
  Component.apply(this, arguments);
}

ProseEditorTools.Prototype = function() {

  this.render = function($$) {
    var el = $$("div").addClass('sc-example-toolbar');
    var commandStates = this.props.commandStates;
    var toolRegistry = this.context.toolRegistry;

    var tools = [];
    toolRegistry.forEach(function(tool, name) {
      if (!tool.options.overlay) {
        // TODO: Remove clone hack once #577 is fixed
        tools.push(
          $$(tool.Class, clone(commandStates[name])).append(
            $$(Icon, {icon: tool.options.icon})
          )
        );
      }
    });

    el.append(
      $$(Toolbar.Group).append(
        tools
      )
    );
    return el;
  };
};

Component.extend(ProseEditorTools);
module.exports = ProseEditorTools;

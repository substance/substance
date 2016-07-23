'use strict';

var Component = require('./Component');
var ToolGroup = require('./ToolGroup');

function Toolbar() {
  Component.apply(this, arguments);
}

Toolbar.Prototype = function() {

  this.render = function($$) {
    var el = $$("div").addClass(this.getClassNames());
    var commandStates = this.props.commandStates;
    var toolRegistry = this.context.toolRegistry;
    var tools = [];
    toolRegistry.forEach(function(tool, name) {
      if (!tool.options.overlay) {
        var toolProps = commandStates[name];
        // HACK: Also always include tool name which is equal to command name
        toolProps.name = name;
        tools.push(
          $$(tool.Class, toolProps)
        );
      }
    });
    el.append(
      $$(ToolGroup).append(tools)
    );
    return el;
  };

  this.getClassNames = function() {
    return 'sc-toolbar';
  };

};

Component.extend(Toolbar);
module.exports = Toolbar;

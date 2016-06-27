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

  this.getClassNames = function() {
    return 'sc-toolbar';
  };

};

Component.extend(Toolbar);
module.exports = Toolbar;

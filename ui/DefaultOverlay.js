'use strict';

var Component = require('./Component');

function DefaultOverlay() {
  Component.apply(this, arguments);
}

DefaultOverlay.Prototype = function() {

  this.render = function($$) {
    var el = $$('div').addClass(this.getClassNames());
    var commandStates = this.props.commandStates;
    var toolRegistry = this.context.toolRegistry;
    toolRegistry.forEach(function(tool) {
      if (tool.options.overlay) {
        var toolProps = tool.Class.static.getProps(commandStates);
        if (toolProps) {
          var toolName = tool.Class.static.name;
          el.append(
            $$(tool.Class, toolProps).ref(toolName)
          );
        }
      }
    });
    return el;
  };

  this.getClassNames = function() {
    return "sc-default-overlay";
  };

};

Component.extend(DefaultOverlay);

module.exports = DefaultOverlay;

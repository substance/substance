var Substance = require("../basics");
var Tool = require('./tool');

function SwitchTypeTool() {
  Tool.call(this);
}

SwitchTypeTool.Prototype = function() {

  // Provides the type of the associated annotation node.
  // The default implementation uses the Tool's static name.
  // Override this method to customize.
  this.getNodeType = function() {
    if (this.constructor.static.name) {
      return this.constructor.static.name;
    } else {
      throw new Error('Contract: SwitchTypeTool.static.name should be associated to a document annotation type.');
    }
  };

  this.getData = function() {
    return {};
  };

  this.matchNode = function(node) {
    return (node.type === this.getNodeType());
  };

  this.update = function(surface, sel) {
    this.surface = surface;
    if (!surface.isEnabled() || sel.isNull() || sel.isContainerSelection() ||
        !surface.getEditor().isContainerEditor()) {
      return this.setDisabled();
    }
    var container = surface.getEditor().getContainer();
    var node = container.getNodeForComponentPath(sel.start.path);
    if (this.matchNode(node)) {
      return this.setToolState({
        enabled: true,
        selected: true
      });
    } else if (node.isInstanceOf('text')) {
      return this.setToolState({
        enabled: true,
        selected: true,
        sel: sel,
        node: node,
        mode: "switch"
      });
    }
  };

  this.performAction = function() {
    var state = this.getToolState();
    if (state.mode === "switch") {
      this.surface.getEditor().switchType(state.sel, this.getNodeType(), this.getData());
    }
  };
};

Substance.inherit(SwitchTypeTool, Tool);

module.exports = SwitchTypeTool;

var Substance = require("../basics");

function Tool(context) {
  Substance.EventEmitter.call(this);

  this.context = context;

  this.state = {
    // we disable tools by default
    disabled: true,
    // if the tool is turned on / toggled on
    active: false
  };
}

Tool.Prototype = function() {

  this.needsEnabledSurface = true;

  this.getName = function() {
    return this.constructor.static.name;
  };

  this.getSurface = function() {
    return this.surface;
  };

  this.getDocument = function() {
    var surface = this.getSurface();
    if (surface) {
      return surface.getDocument();
    }
  };

  this.getContainer = function() {
    var surface = this.getSurface();
    if (surface) {
      return surface.getContainer();
    }
  };

  this.setToolState = function(newState) {
    var oldState = this.state;
    this.state = newState;
    this.emit('toolstate:changed', newState, this, oldState);
  };

  this.getToolState = function() {
    return this.state;
  };

  this.isEnabled = function() {
    return !this.state.disabled;
  };

  this.isDisabled = function() {
    return this.state.disabled;
  };

  this.setEnabled = function() {
    this.setToolState({
      disabled: false,
      active: false
    });
  };

  this.setDisabled = function() {
    this.setToolState({
      disabled: true,
      active: false
    });
  };

  this.disableTool = function() {
    console.error('DEPRECATED: use tool.setDisabled()');
    this.setDisabled();
  };

  this.setSelected = function() {
    this.setToolState({
      disabled: false,
      active: true
    });
  };

  /* jshint unused:false */
  this.update = function(surface, sel) {
    this.surface = surface;
    if (this.needsEnabledSurface && !surface.isEnabled()) {
      return this.setDisabled();
    }
  };

  //legacy TODO fixme
  this.updateToolState = function(sel, surface) {
    return this.update(surface, sel);
  };
};

Substance.inherit(Tool, Substance.EventEmitter);

module.exports = Tool;

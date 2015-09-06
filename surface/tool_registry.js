"use strict";

var Substance = require('../basics');

// TODO: this should be removed, when michaels tool refactor is done.
var ToolRegistry = function() {
  Substance.Registry.call(this);
};

ToolRegistry.Prototype = function() {

  this.dispose = function() {
    this.each(function(tool) {
      if (tool.dispose) {
        tool.dispose();
      }
    });
    this.clear();
  };

};

Substance.inherit(ToolRegistry, Substance.Registry);

module.exports = ToolRegistry;

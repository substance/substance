var Surface = require('../../../ui/surface');

function StubSurface(surfaceId, doc, sel) {

  this.name = surfaceId;
  this.selection = sel;

  this.getName = function() {
    return this.name;
  };

  this.getDocument = function() {
    return doc;
  };

  this.getSelection = function() {
    return this.selection;
  };

  this.setSelection = function(sel) {
    this.selection = sel;
  };

  this.transaction = Surface.prototype.transaction;
}

module.exports = StubSurface;

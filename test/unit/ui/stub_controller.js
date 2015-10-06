var StubSurface = require('./stub_surface');

function StubController(doc, sel) {

  this.surface = new StubSurface('main', doc, sel);

  this.getSurface = function() {
    return this.surface;
  };

  this.getSelection = function() {
    return this.surface.getSelection();
  };

  this.getDocument = function() {
    return doc;
  };

  this.getContainerId = function() {
    return 'main';
  };
}

module.exports = StubController;
'use strict';

var Container = require('./Container');

function ContainerAdapter(doc, path) {
  this.document = doc;
  this.path = path;
  this.id = String(path);

  // HACK: putting this into a place so that doc.get(this.id) works
  // Hopefully this won't hurt :/
  doc.data.nodes[this.id] = this;
}

ContainerAdapter.Prototype = function() {

  this._isDocumentNode = false;
  this._isContainer = false;

  this.getContentPath = function() {
    return this.path;
  };
};

Container.extend(ContainerAdapter);

Object.defineProperties(ContainerAdapter.prototype, {
  nodes: {
    get: function() {
      return this.document.get(this.path);
    },
  }
});

module.exports = ContainerAdapter;

'use strict';

var $ = require('../../util/jquery');
var DocumentNode = require('../../model/DocumentNode');

// Abstract interface
// There are ImageFigures, TableFigures, VideoFigures

var Figure = DocumentNode.extend({
  name: "figure",
  properties: {
    "title": "string",
    "caption": "string",
    "content": "id"
  },

  setLabel: function(label) {
    this.label = label;
    this.emit('label', label);
  },

  // Set compiled text representation
  // E.g. useful for print output
  setText: function(compiledText) {
    this.text = compiledText;
  },

  // For compatibility with Collection interface
  didInitialize: function() {
    this.guid = this.id;
  },

  getContentNode: function() {
    return this.document.get(this.content);
  },

});

// declare editable components, so that we can enable ContainerEditor features
Figure.static.components = ['title', 'caption'];

module.exports = Figure;

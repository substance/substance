'use strict';

var oo = require('../../util/oo');
var DocumentNode = require('../../model/DocumentNode');

// Abstract interface
// There are ImageFigures, TableFigures, VideoFigures

function Figure() {
  Figure.super.apply(this, arguments);

  this.guid = this.id;
}

oo.inherit(Figure, DocumentNode);

Figure.static.name = "figure";

Figure.static.schema = {
  "title": { type: "text" },
  "content": { type: "id" },
  "caption": { type: "text" }
};

Figure.prototype.setLabel = function(label) {
  this.label = label;
  this.emit('label', label);
};

  // Set compiled text representation
  // E.g. useful for print output
Figure.prototype.setText = function(compiledText) {
  this.text = compiledText;
};

Figure.prototype.getContentNode =  function() {
  return this.document.get(this.content);
};

module.exports = Figure;

'use strict';

var DocumentNode = require('../../model/DocumentNode');

// Abstract interface
// There are ImageFigures, TableFigures, VideoFigures

function Figure() {
  Figure.super.apply(this, arguments);

  this.guid = this.id;
}

DocumentNode.extend(Figure, function FigurePrototype() {

  this.setLabel = function(label) {
    this.label = label;
    this.emit('label', label);
  };

    // Set compiled text representation
    // E.g. useful for print output
  this.setText = function(compiledText) {
    this.text = compiledText;
  };

  this.getContentNode =  function() {
    return this.document.get(this.content);
  };

});

Figure.static.name = "figure";

Figure.static.defineSchema({
  "title": "text",
  "content": "id",
  "caption": "text",
  "guid": { type: "id", optional: true }
});

module.exports = Figure;

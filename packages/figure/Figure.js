'use strict';

var oo = require('../../util/oo');
var DocumentNode = require('../../model/DocumentNode');

// Abstract interface
// There are ImageFigures, TableFigures, VideoFigures

function Figure() {
  Figure.super.apply(this, arguments);

  this.guid = this.id;
}

var name = "figure";

var schema = {
  "title": "text",
  "content": "id",
  "caption": "text",
  "guid": { type: "id", volatile: true }
};

Figure.Prototype = function() {

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

};

oo.inherit(Figure, DocumentNode);

Figure.static.name = name;

Figure.static.defineSchema(schema);

module.exports = Figure;

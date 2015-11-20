"use strict";

var HtmlExporter = require('./HTMLExporter');
var ClipboardImporter = require('./ClipboardImporter');
var converters = ClipboardImporter.converters;
var CLIPBOARD_CONTAINER_ID = ClipboardImporter.CLIPBOARD_CONTAINER_ID;

// FIXME: this is not working yet
function ClipboardExporter() {
  ClipboardExporter.super.call(this, {
    converters: converters
  });
}

ClipboardExporter.Prototype = function() {

  this.convertDocument = function(doc) {
    var content = doc.get(CLIPBOARD_CONTAINER_ID);
    if (!content) {
      throw new Error('Illegal clipboard document: could not find container "' + CLIPBOARD_CONTAINER_ID + '"');
    }
    return this.convertContainer(content);
  };

};

HtmlExporter.extend(ClipboardExporter);

ClipboardExporter.CLIPBOARD_CONTAINER_ID = CLIPBOARD_CONTAINER_ID;

module.exports = ClipboardExporter;

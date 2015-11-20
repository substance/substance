"use strict";

var HtmlExporter = require('./HTMLExporter');
var converters = require('./ClipboardImporter').converters;

// FIXME: this is not working yet
function ClipboardExporter() {
  ClipboardExporter.super.call(this, {
    converters: converters,
    containerId: 'fixme'
  });
}

ClipboardExporter.Prototype = function() {

};

HtmlExporter.extend(ClipboardExporter);

module.exports = ClipboardExporter;

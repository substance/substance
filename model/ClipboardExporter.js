"use strict";

var oo = require('../util/oo');
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

oo.inherit(ClipboardExporter, HtmlExporter);

module.exports = ClipboardExporter;

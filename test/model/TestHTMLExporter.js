'use strict';

var HTMLExporter = require('../../model/HTMLExporter');
var converters = require('./TestHTMLImporter').converters;

function TestHTMLExporter() {
  TestHTMLExporter.super.call(this, {
    converters: converters,
    containerId: 'main'
  });
}

HTMLExporter.extend(TestHTMLExporter);

module.exports = TestHTMLExporter;

var oo = require('../../util/oo');
var HTMLExporter = require('../../model/HTMLExporter');
var converters = require('./TestHTMLImporter').converters;

function TestHTMLExporter() {
  TestHTMLExporter.super.call(this, {
    converters: converters
  });
}

TestHTMLExporter.Prototype = function() {};

oo.inherit(TestHTMLExporter, HTMLExporter);

module.exports = TestHTMLExporter;

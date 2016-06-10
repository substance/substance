'use strict';

var HTMLExporter = require('../../model/HTMLExporter');
var converters = require('./TestHTMLImporter').converters;

function TestHTMLExporter() {
  TestHTMLExporter.super.call(this, {
    converters: converters
  });
}

TestHTMLExporter.Prototype = function() {

  this.convertDocument = function(doc, htmlEl) {
    var bodyEl = htmlEl.find('body');
    var body = doc.get('body');
    bodyEl.append(
      this.convertContainer(body)
    );
    return htmlEl;
  };

};

HTMLExporter.extend(TestHTMLExporter);

module.exports = TestHTMLExporter;

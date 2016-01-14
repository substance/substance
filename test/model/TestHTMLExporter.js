'use strict';

var HTMLExporter = require('../../model/HTMLExporter');
var converters = require('./TestHTMLImporter').converters;

function TestHTMLExporter() {
  TestHTMLExporter.super.call(this, {
    converters: converters
  });
}

HTMLExporter.extend(TestHTMLExporter, function() {

  this.convertDocument = function(doc, htmlEl) {
    var bodyEl = htmlEl.find('body');
    var main = doc.get('main');
    bodyEl.append(
      this.convertContainer(main)
    );
    return htmlEl;
  };

});

module.exports = TestHTMLExporter;

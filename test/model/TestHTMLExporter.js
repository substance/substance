'use strict';

var HTMLExporter = require('../../model/HTMLExporter');
var converters = require('./TestHTMLImporter').converters;

function TestHTMLExporter() {
  TestHTMLExporter.super.call(this, {
    converters: converters
  });
}

HTMLExporter.extend(TestHTMLExporter, function() {

  this.convertDocument = function(doc) {
    var element = this.$$('body');
    var main = doc.get('main');
    element.append(
      this.convertContainer(main)
    );
    return element;
  };

});

module.exports = TestHTMLExporter;

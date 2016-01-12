'use strict';

var XMLExporter = require('../../model/XMLExporter');
var converters = require('./TestXMLImporter').converters;
var DefaultDOMElement = require('../../ui/DefaultDOMElement');

function TestXMLExporter() {
  TestXMLExporter.super.call(this, {
    converters: converters
  });
}

XMLExporter.extend(TestXMLExporter, function() {

  this.convertDocument = function(doc, articleEl) {
    var main = doc.get('main');
    articleEl.append(
      this.convertContainer(main)
    );
    return articleEl;
  };

  this.createDocumentElement = function() {
    return DefaultDOMElement.parseXML('<article></article>');
  };
});

module.exports = TestXMLExporter;

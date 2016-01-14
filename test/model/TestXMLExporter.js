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

  this.convertDocument = function(doc) {
    var articleEl = DefaultDOMElement.parseXML('<article></article>');
    var main = doc.get('main');
    articleEl.append(
      this.convertContainer(main)
    );
    return articleEl;
  };

});

module.exports = TestXMLExporter;

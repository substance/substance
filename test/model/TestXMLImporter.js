'use strict';

var XMLImporter = require('../../model/XMLImporter');
var schema = require('./TestSchema');
var TestArticle = require('./TestArticle');

var converters = [
  require('../../packages/paragraph/ParagraphXMLConverter'),
  require('../../packages/image/ImageXMLConverter'),
  require('../../packages/heading/HeadingXMLConverter'),
  require('../../packages/emphasis/EmphasisXMLConverter'),
  require('../../packages/strong/StrongXMLConverter'),
  require('../../packages/link/LinkXMLConverter'),
  require('./TestMetaNodeXMLConverter')
];

function TestXMLImporter() {
  TestXMLImporter.super.call(this, {
    schema: schema,
    converters: converters,
    DocumentClass: TestArticle
  });
}

TestXMLImporter.Prototype = function() {

  this.convertDocument = function(documentEl) {
    var bodyEl = documentEl.find('body');
    this.convertContainer(bodyEl.children, 'body');
  };

};

XMLImporter.extend(TestXMLImporter);

TestXMLImporter.converters = converters;

module.exports = TestXMLImporter;

'use strict';

var HTMLImporter = require('../../model/HTMLImporter');
var schema = require('./TestSchema');
var TestArticle = require('./TestArticle');

var converters = [
  require('../../packages/paragraph/ParagraphHTMLConverter'),
  require('../../packages/heading/HeadingHTMLConverter'),
  require('../../packages/emphasis/EmphasisHTMLConverter'),
  require('../../packages/strong/StrongHTMLConverter'),
  require('../../packages/link/LinkHTMLConverter'),
];

function TestHTMLImporter() {
  TestHTMLImporter.super.call(this, {
    schema: schema,
    converters: converters,
    DocumentClass: TestArticle
  });
}

TestHTMLImporter.Prototype = function() {

  this.convertDocument = function(documentEl) {
    var bodyEl = documentEl.find('body');
    this.convertContainer(bodyEl.children, 'main');
  };

};

HTMLImporter.extend(TestHTMLImporter);

TestHTMLImporter.converters = converters;

module.exports = TestHTMLImporter;
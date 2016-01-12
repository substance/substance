'use strict';

var XMLImporter = require('../../model/XMLImporter');
var schema = require('./TestSchema');
var TestArticle = require('./TestArticle');

var converters = [
  require('../../packages/paragraph/ParagraphXMLConverter'),
  require('../../packages/heading/HeadingXMLConverter'),
  require('../../packages/emphasis/EmphasisXMLConverter'),
  require('../../packages/strong/StrongXMLConverter'),
  require('../../packages/link/LinkXMLConverter'),
  require('../../packages/table/TableXMLConverter'),
  require('../../packages/table/TableSectionXMLConverter'),
  require('../../packages/table/TableRowXMLConverter'),
  require('../../packages/table/TableCellXMLConverter'),
  require('../../packages/list/ListXMLConverter'),
  require('../../packages/list/ListItemXMLConverter'),
  require('./TestMetaNodeXMLConverter')
];

function TestXMLImporter() {
  TestXMLImporter.super.call(this, {
    schema: schema,
    converters: converters,
    DocumentClass: TestArticle
  });
}

XMLImporter.extend(TestXMLImporter, function() {

  this.convertDocument = function(documentEl) {
    var bodyEl = documentEl.find('body');
    this.convertContainer(bodyEl.children, 'main');
  };

});

TestXMLImporter.converters = converters;

module.exports = TestXMLImporter;

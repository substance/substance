'use strict';

var oo = require('../../util/oo');
var HTMLImporter = require('../../model/HTMLImporter');
var schema = require('./test_schema');
var TestArticle = require('./test_article');

var converters = [
  require('../../packages/paragraph/ParagraphHtmlConverter'),
  require('../../packages/heading/HeadingHtmlConverter'),
  require('../../packages/emphasis/EmphasisHtmlConverter'),
  require('../../packages/strong/StrongHtmlConverter'),
  require('../../packages/link/LinkHtmlConverter'),
  require('../../packages/table/TableHtmlConverter'),
  require('../../packages/table/TableSectionHtmlConverter'),
  require('../../packages/table/TableRowHtmlConverter'),
  require('../../packages/table/TableCellHtmlConverter'),
  require('../../packages/list/ListHtmlConverter'),
  require('../../packages/list/ListItemHtmlConverter'),
];

function TestHTMLImporter() {
  TestHTMLImporter.super.call(this, {
    schema: schema,
    converters: converters,
    DocumentClass: TestArticle,
    containerId: 'main'
  });
}

TestHTMLImporter.Prototype = function() {
};

oo.inherit(TestHTMLImporter, HTMLImporter);

TestHTMLImporter.converters = converters;

module.exports = TestHTMLImporter;
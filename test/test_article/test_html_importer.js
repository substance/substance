'use strict';

var oo = require('../../util/oo');
var HtmlImporter = require('../../model/HtmlImporter');
var schema = require('./test_schema');

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
]

function TestHtmlImporter() {
  TestHtmlImporter.super.call(this, { schema: schema, converters: converters, containerId: 'main'});
}

TestHtmlImporter.Prototype = function() {
};

oo.inherit(TestHtmlImporter, HtmlImporter);

module.exports = TestHtmlImporter;
'use strict';

var Document = require('../../document');
var MetaNode = require('./test_article_meta');
var TestNode = require('./test_node');
var TestContainerAnnotation = require('./test_container_annotation');

var schema = new Document.Schema("test-article", "1.0.0");

schema.getDefaultTextType = function() {
  return 'paragraph';
};

schema.addNodes([
  MetaNode,
  Document.Paragraph,
  Document.Heading,
  Document.Emphasis,
  Document.Strong,
  Document.Link,
  Document.Table,
  Document.TableSection,
  Document.TableRow,
  Document.TableCell,
  Document.List,
  Document.ListItem,
  TestNode,
  TestContainerAnnotation
]);

module.exports = schema;

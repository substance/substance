'use strict';

var Document = require('../../model/Document');
var Schema = require('../../model/DocumentSchema');
var MetaNode = require('./TestMetaNode');
var TestNode = require('./TestNode');
var TestContainerAnnotation = require('./TestContainerAnnotation');
var TestStructuredNode = require('./TestStructuredNode');
var Paragraph = require('../../packages/paragraph/Paragraph');
var Heading = require('../../packages/heading/Heading');
var Emphasis = require('../../packages/emphasis/Emphasis');
var Strong = require('../../packages/strong/Strong');
var Link = require('../../packages/link/Link');
var Table = require('../../packages/table/Table');
var TableSection = require('../../packages/table/TableSection');
var TableRow = require('../../packages/table/TableRow');
var TableCell = require('../../packages/table/TableCell');
var List = require('../../packages/list/List');
var ListItem = require('../../packages/list/ListItem');

var schema = new Schema("test-article", "1.0.0");

schema.getDefaultTextType = function() {
  return 'paragraph';
};

schema.addNodes([
  MetaNode,
  Paragraph,
  Heading,
  Emphasis,
  Strong,
  Link,
  Table, TableSection, TableRow, TableCell,
  List, ListItem,
  TestNode,
  TestContainerAnnotation,
  TestStructuredNode
]);

module.exports = schema;

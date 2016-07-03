'use strict';

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
var Image = require('../../packages/image/Image');
var Codeblock = require('../../packages/codeblock/Codeblock');
var InlineWrapper = require('../../packages/inline-wrapper/InlineWrapper');

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
  Image,
  Codeblock,
  TestNode,
  TestContainerAnnotation,
  TestStructuredNode,
  InlineWrapper
]);

module.exports = schema;

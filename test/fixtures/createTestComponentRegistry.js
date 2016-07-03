'use strict';

var Registry = require('../../util/Registry');
var ParagraphComponent = require('../../packages/paragraph/ParagraphComponent');
var HeadingComponent = require('../../packages/heading/HeadingComponent');
var TestContainerComponent = require('./TestContainerComponent');
var TestStructuredNodeComponent = require('./TestStructuredNodeComponent');
var InlineWrapperComponent = require('../../packages/inline-wrapper/InlineWrapperComponent');

module.exports = function createTestComponentRegistry() {
  var componentRegistry = new Registry();
  componentRegistry.add('paragraph', ParagraphComponent);
  componentRegistry.add('heading', HeadingComponent);
  componentRegistry.add('container', TestContainerComponent);
  componentRegistry.add('structured-node', TestStructuredNodeComponent);
  componentRegistry.add('inline-wrapper', InlineWrapperComponent);
  return componentRegistry;
};

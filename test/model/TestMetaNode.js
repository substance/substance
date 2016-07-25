'use strict';

var DocumentNode = require('../../model/DocumentNode');

function TestMetaNode() {
  TestMetaNode.super.apply(this, arguments);
}

DocumentNode.extend(TestMetaNode);

TestMetaNode.define({
  type: 'meta',
  title: 'text'
});

module.exports = TestMetaNode;

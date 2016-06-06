'use strict';

require('../QUnitExtensions');
var DocumentSession = require('../../model/DocumentSession');

var fixture = require('../fixtures/createTestArticle');
var headersAndParagraphs = require('../fixtures/headersAndParagraphs');

function docWithTestNodes(tx) {
  headersAndParagraphs(tx);
  tx.create({
    type: "test-node",
    id: "test",
    arrayVal: [1,2,3]
  });
}

QUnit.module('model/PathEventProxy');

QUnit.test("Updating a property", function(assert) {
  var doc = fixture(docWithTestNodes);
  var callCount = 0;
  doc.getEventProxy('path').on(['test', 'arrayVal'], function() {
    callCount++;
  });
  doc.update(['test', 'arrayVal'], { insert: { offset: 1, value: '1000' } } );
  assert.equal(callCount, 1, "Event proxy listener should have been called.");
});

QUnit.test("Setting a property", function(assert) {
  var doc = fixture(docWithTestNodes);
  var callCount = 0;
  doc.getEventProxy('path').on(['test', 'arrayVal'], function() {
    callCount++;
  });
  doc.set(['test', 'arrayVal'], [1,1,1]);
  assert.equal(callCount, 1, "Event proxy listener should have been called.");
});

QUnit.test("Setting a property and deleting the node afterwards", function(assert) {
  var doc = fixture(docWithTestNodes);
  var docSession = new DocumentSession(doc);
  var callCount = 0;
  doc.getEventProxy('path').on(['test', 'arrayVal'], function() {
    callCount++;
  });
  docSession.transaction(function(tx) {
    tx.set(['test', 'arrayVal'], [1,1,1]);
    tx.delete('test');
  });
  assert.equal(callCount, 0, "Event proxy listener doesn't get called when node is deleted.");
});

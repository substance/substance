'use strict';

require('../qunit_extensions');

var MessageQueue = require('../../../util/MessageQueue');
var WebSocketServer = require('../../../util/WebSocketServer');
var WebSocket = require('../../../util/WebSocket');
var CollabSession = require('../../../model/CollabSession');
var StubHub = require('../../../util/StubHub');
var TestStore = require('../../../util/TestStore');


QUnit.module('model/CollabHub');

var doc1, doc2;
var store, messageQueue;
var wss, ws1, ws2;
var hub, client1, client2;

function _setup(fixture, createMessages) {
  doc1 = fixture.createArticle();
  doc2 = fixture.createArticle();
  store = new TestStore({
    "test": fixture.createChangeset()
  });
  messageQueue = new MessageQueue();
  wss = new WebSocketServer(messageQueue, 'hub');
  ws1 = new WebSocket(messageQueue, 'user1', 'hub');
  ws2 = new WebSocket(messageQueue, 'user2', 'hub');
  hub = new StubHub(wss, store);
  client1 = new CollabSession(doc1, ws1, {
    docId: 'test',
    docVersion: 1
  });
  client2 = new CollabSession(doc2, ws2, {
    docId: 'test',
    docVersion: 1
  });
  // TODO: can we shoult make this configurable
  client1.stop();
  client2.stop();

  wss.connect();
  ws1.connect();
  ws2.connect();

  messageQueue.clear();
  messageQueue.messages = createMessages();
}

QUnit.test("Insert at same position", function(assert) {
  var twoParagraphs = require('../../fixtures/collab/two-paragraphs');
  var insertAtSamePos = require('../../fixtures/collab/insertAtSamePos');
  _setup(twoParagraphs, insertAtSamePos);
  messageQueue.flush();
  assert.equal(doc1.get(['p1', 'content']), '01234ba56789');
  assert.equal(doc2.get(['p1', 'content']), '01234ba56789');
});


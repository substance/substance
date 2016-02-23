'use strict';

require('../qunit_extensions');

var MessageQueue = require('../../collab/MessageQueue');
var TestWebSocketServer = require('../../collab/TestWebSocketServer');
var TestWebSocket = require('../../collab/TestWebSocket');
var TestCollabSession = require('../../collab/TestCollabSession');
var TestCollabHub = require('../../collab/TestCollabHub');
var TestHubClient = require('../../collab/TestHubClient');
var TestStore = require('../../collab/TestStore');
var DocumentChange = require('../../../model/DocumentChange');


QUnit.module('model/CollabHub');

var doc1, doc2, session1, session2;
var store, messageQueue;
var wss, ws1, ws2;
var hub, client1, client2;

function _setup(fixture, messagesFromSnapshot) {
  doc1 = fixture.createArticle();
  doc2 = fixture.createArticle();
  store = new TestStore({
    "test": fixture.createChangeset()
  });
  messageQueue = new MessageQueue();
  wss = new TestWebSocketServer(messageQueue, 'hub');
  ws1 = new TestWebSocket(messageQueue, 'user1', 'hub');
  ws2 = new TestWebSocket(messageQueue, 'user2', 'hub');
  hub = new TestCollabHub(wss, store);
  client1 = new TestHubClient({
    messageQueue: messageQueue,
    ws: ws1,
    session: {
      sessionToken: 'user1token',
      user: {
        'id': 'user1',
        'name': 'User 1'
      }
    }
  });
  client2 = new TestHubClient({
    messageQueue: messageQueue,
    ws: ws2,
    session: {
      sessionToken: 'user2token',
      user: {
        'id': 'user2',
        'name': 'User 2'
      }
    }
  });

  session1 = new TestCollabSession(doc1, {
    hubClient: client1,
    docId: 'test',
    docVersion: 1
  });
  session2 = new TestCollabSession(doc2, {
    hubClient: client2,
    docId: 'test',
    docVersion: 1
  });
  // this stops the user sessions from auto-committing
  session1.stop();
  session2.stop();
  // this connects the peers 'physically'
  wss.connect();
  ws1.connect();
  ws2.connect();
  // HACK: to avoid that the clients send new messages
  // we don't deliver the 'open' event
  // Now we need to make sure that the hubClients are still handling messages afterwards
  client1._connect();
  client2._connect();
  // seed the message queue with the messages from the fixture
  messageQueue.clear();
  messageQueue.messages = messagesFromSnapshot();
  // HACK: as we are just replaying messages here,
  // we need to apply the local change, which would is usually done before the
  // message is sent
  messageQueue.on('message:sent', function(message) {
    if (message.to === 'hub' && message.data.type === 'commit') {
      var change = DocumentChange.fromJSON(message.data.change);
      if (message.from === "user1") {
        doc1._apply(change);
        session1._afterCommit(change);
      } else if (message.from === "user2") {
        doc2._apply(change);
        session2._afterCommit(change);
      }
    }
  });
}

QUnit.test("Insert at same position", function(assert) {
  /*
    This fixture has been recorded with the CollabWriter example using `#debug`
    1. insert 'a' after '01234' as user 1
    2. insert 'b' after '01234' as user 2
  */
  var insertAtSamePos = require('../../fixtures/collab/insertAtSamePos');
  var twoParagraphs = require('../../fixtures/collab/two-paragraphs');
  _setup(twoParagraphs, insertAtSamePos);
  messageQueue.flush();
  assert.equal(doc1.get(['p1', 'content']), '01234ba56789');
  assert.equal(doc2.get(['p1', 'content']), '01234ba56789');
});


'use strict';

require('../qunit_extensions');

var MessageQueue = require('../../collab/MessageQueue');
var TestWebSocketServer = require('../../collab/TestWebSocketServer');
var TestCollabSession = require('../../collab/TestCollabSession');
var TestCollabServer = require('../../collab/TestCollabServer');
var TestWebSocketConnection = require('../../collab/TestWebSocketConnection');
var CollabClient = require('../../../collab/CollabClient');
var DocumentStore = require('../../../collab/DocumentStore');
var ChangeStore = require('../../../collab/ChangeStore');
var DocumentEngine = require('../../../collab/DocumentEngine');

var documentStoreSeed = require('../../fixtures/collab/documentStoreSeed');
var changeStoreSeed = require('../../fixtures/collab/changeStoreSeed');
var twoParagraphs = require('../../fixtures/collab/two-paragraphs');
var DocumentChange = require('../../../model/DocumentChange');

QUnit.module('model/CollabServer');

var doc1, doc2, session1, session2;
var documentEngine, messageQueue, changeStore, documentStore;
var wss, conn1,conn2;
var hub, client1, client2;

function _setup(messagesFromSnapshot) {
  doc1 = twoParagraphs.createArticle();
  doc2 = twoParagraphs.createArticle();

  documentStore = new DocumentStore().seed(documentStoreSeed);
  changeStore = new ChangeStore().seed(changeStoreSeed);

  documentEngine = new DocumentEngine({
    documentStore: documentStore,
    changeStore: changeStore,
    schemas: {
      'prose-article': {
        name: 'prose-article',
        version: '1.0.0',
        documentFactory: twoParagraphs
      }
    }
  });

  messageQueue = new MessageQueue();
  
  wss = new TestWebSocketServer({
    messageQueue: messageQueue,
    serverId: 'hub',
    manualConnect: true
  });

  hub = new TestCollabServer({
    documentEngine: documentEngine
  });

  // Once the server we can open connections
  conn1 = new TestWebSocketConnection({
    messageQueue: messageQueue,
    clientId: 'user1',
    serverId: 'hub',
    manualConnect: true
  });

  conn2 = new TestWebSocketConnection({
    messageQueue: messageQueue,
    clientId: 'user2',
    serverId: 'hub',
    manualConnect: true
  });

  client1 = new CollabClient({
    connection: conn1
  });

  client2 = new CollabClient({
    connection: conn2
  });

  session1 = new TestCollabSession(doc1, {
    collabClient: client1,
    docId: 'test-doc',
    docVersion: 1
  });
  session2 = new TestCollabSession(doc2, {
    collabClient: client2,
    docId: 'test-doc',
    docVersion: 1
  });

  // HACK: overriding the CollabSession.start() to prevent
  // the session from auto-committing and running forever
  session1.start = function(){};
  session2.start = function(){};

  // this connects the peers 'physically'
  wss.connect();
  conn1.connect();
  conn2.connect();

  // HACK: to avoid that the clients send new messages
  // we don't deliver the 'open' event
  // Now we need to make sure that the hubClients are still handling messages afterwards
  // client1._connect();
  // client2._connect();

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
  // var twoParagraphs = require('../../fixtures/collab/two-paragraphs');
  _setup(insertAtSamePos);
  messageQueue.flush();
  assert.equal(doc1.get(['p1', 'content']), '01234ba56789');
  assert.equal(doc2.get(['p1', 'content']), '01234ba56789');
});


// NOTE: Disabled this for now. We will focus on unit test of CollabSession/CollabServer first.
// ---------------------------
//
// 'use strict';
//
// require('../QUnitExtensions');

// var MessageQueue = require('../collab/MessageQueue');
// var TestWebSocketServer = require('../collab/TestWebSocketServer');
// var TestCollabSession = require('../collab/TestCollabSession');
// var TestCollabServer = require('../collab/TestCollabServer');
// var TestWebSocketConnection = require('../collab/TestWebSocketConnection');
// var CollabClient = require('../../collab/CollabClient');
// var DocumentStore = require('../../collab/DocumentStore');
// var ChangeStore = require('../../collab/ChangeStore');
// var DocumentEngine = require('../../collab/DocumentEngine');

// var documentStoreSeed = require('../fixtures/collab/documentStoreSeed');
// var changeStoreSeed = require('../fixtures/collab/changeStoreSeed');
// var twoParagraphs = require('../fixtures/collab/twoParagraphs');
// var DocumentChange = require('../../model/DocumentChange');
// var cloneDeep = require('lodash/cloneDeep');

// QUnit.module('model/CollabServer');

// var doc1, doc2, session1, session2;
// var documentEngine, messageQueue, changeStore, documentStore;
// var wss, conn1,conn2;
// var hub, client1, client2;

// function _setup() {
//   doc1 = twoParagraphs.createArticle();
//   doc2 = twoParagraphs.createArticle();

//   documentStore = new DocumentStore().seed(documentStoreSeed);
//   changeStore = new ChangeStore().seed(changeStoreSeed);

//   documentEngine = new DocumentEngine({
//     documentStore: documentStore,
//     changeStore: changeStore,
//     schemas: {
//       'prose-article': {
//         name: 'prose-article',
//         version: '1.0.0',
//         documentFactory: twoParagraphs
//       }
//     }
//   });

//   messageQueue = new MessageQueue();

//   wss = new TestWebSocketServer({
//     messageQueue: messageQueue,
//     serverId: 'hub',
//     // manualConnect: true
//   });

//   hub = new TestCollabServer({
//     documentEngine: documentEngine
//   });

//   hub.bind(wss);

//   // Once the server we can open connections
//   conn1 = new TestWebSocketConnection({
//     messageQueue: messageQueue,
//     clientId: 'user1',
//     serverId: 'hub',
//     // manualConnect: true
//   });

//   conn2 = new TestWebSocketConnection({
//     messageQueue: messageQueue,
//     clientId: 'user2',
//     serverId: 'hub',
//     // manualConnect: true
//   });

//   client1 = new CollabClient({
//     connection: conn1
//   });
//   client2 = new CollabClient({
//     connection: conn2
//   });

//   session1 = new TestCollabSession(doc1, {
//     collabClient: client1,
//     documentId: 'test-doc',
//     version: 1
//   });
//   session2 = new TestCollabSession(doc2, {
//     collabClient: client2,
//     documentId: 'test-doc',
//     version: 1
//   });

//   // HACK: overriding the CollabSession.startAutoCommit() to prevent
//   // the session from auto-committing and running forever
//   session1.startAutoCommit = function(){};
//   session2.startAutoCommit = function(){};

//   // this connects the peers 'physically'
//   // wss.connect();
//   // conn1.connect();
//   // conn2.connect();

//   // HACK: to avoid that the clients send new messages
//   // we don't deliver the 'open' event
//   // Now we need to make sure that the hubClients are still handling messages afterwards
//   // client1._connect();
//   // client2._connect();

//   // HACK: as we are just replaying messages here,
//   // we need to apply the local change, which would is usually done before the
//   // message is sent
//   messageQueue.on('message:sent', function(message) {
//     if (message.to === 'hub' && message.data.type === 'commit') {
//       var change = DocumentChange.fromJSON(message.data.change);
//       if (message.from === 'user1') {
//         doc1._apply(change);
//         session1._afterCommit(change);
//       } else if (message.from === 'user2') {
//         doc2._apply(change);
//         session2._afterCommit(change);
//       }
//     }
//   });
// }

// function _play(messages) {
//   messageQueue.clear();

//   messages.forEach(function(message) {
//     if (message.from === 'hub') {
//       // When we hit a server message we flush the queue, so the server
//       // can do the work
//       messageQueue.flush();
//     } else {
//       messageQueue.pushMessage(cloneDeep(message));
//     }
//   });
//   messageQueue.flush();
// }

// QUnit.test("Insert at same position", function(assert) {
//   /*
//     This fixture has been recorded with the CollabWriter example using `#debug`
//     1. insert 'a' after '01234' as user 1
//     2. insert 'b' after '01234' as user 2
//   */
//   var insertAtSamePos = require('../fixtures/collab/insertAtSamePos');
//   _setup();
//   _play(insertAtSamePos);

//   assert.equal(doc1.get(['p1', 'content']), '01234ba56789');
//   assert.equal(doc2.get(['p1', 'content']), '01234ba56789');
// });

//QUnit.test("Should error if clientVersion > serverVersion", function(assert) {
//  /*
//    This fixture has been recorded with the CollabWriter example using `#debug`
//    1. dump after loading
//    2. remove all messages after connect
//    3. change version from 1 to 3 for user1
//  */
//  var connectWithInvalidVersion = require('../fixtures/collab/connectWithInvalidVersion');
//  _setup();
//  _play(connectWithInvalidVersion);
//
//  // console.log('session1', session1);
//  assert.ok(session1._error, 'There should be an error');
//  assert.notOk(session1._pendingCommit, '_pendingCommit should be null');
//
//  // Now we connect properly
//  session1.connect();
//  messageQueue.flush();
//  assert.notOk(session1._error, 'There should be no error anymore');
//});
//
//QUnit.test("reconnect should transport the selection and update collaborators", function(assert) {
//  /*
//    This fixture has been recorded with the CollabWriter example using `#debug`
//
//    1. just use the initial dump
//    2. select 0123 in line 1 as user 1
//    3. select 567 in line 1 as user 2
//    3. disconnect network of user 1
//    4. reconnect network of user 1
//
//    ATTENTION: excuting this test does not physically disconnect from the netwokr
//    (as in the real world) however we can still check the results if we ignore the
//    warning 'Collaborator already registered for doc. connected twice?'
//
//    TODO: can we find a better way to replay connect/reconnect scenarios
//  */
//  var reconnectWithSelection = require('../fixtures/collab/reconnectWithSelection');
//  _setup();
//  _play(reconnectWithSelection);
//
//  // -> now user 2 should still see 0123 being selected by user 1
//  var collab1 = session2.collaborators[Object.keys(session2.collaborators)[0]];
//  var collab1Sel = collab1.selection.toJSON();
//
//  assert.equal(collab1Sel.startOffset, 0, 'collab2Sel.startOffset should be 0');
//  assert.equal(collab1Sel.endOffset, 4, 'collab2Sel.endOffset should be 4');
//  assert.deepEqual(collab1Sel.path, ['p1', 'content'], 'sel path should be p1.content');
//
//  // -> now user 1 should still see 567 being selected by user 2
//  var collab2 = session1.collaborators[Object.keys(session1.collaborators)[0]];
//  var collab2Sel = collab2.selection.toJSON();
//  console.log('collab2Sel', collab2Sel);
//
//  assert.equal(collab2Sel.startOffset, 5, 'collab2Sel.startOffset should be 5');
//  assert.equal(collab2Sel.endOffset, 8, 'collab2Sel.endOffset should be 8');
//  assert.deepEqual(collab1Sel.path, ['p1', 'content'], 'sel path should be p1.content');
//});

/* eslint-disable consistent-return */
import { module } from 'substance-test'
import DocumentStore from '../../collab/DocumentStore'
import ChangeStore from '../../collab/ChangeStore'
import DocumentEngine from '../../collab/DocumentEngine'
import CollabEngine from '../../collab/CollabEngine'
// import createTestDocumentFactory from '../fixtures/createTestDocumentFactory'
// import createTestArticle from '../fixtures/createTestArticle'
// import createChangeset from '../fixtures/createChangeset'
import documentStoreSeed from '../fixtures/documentStoreSeed'
import changeStoreSeed from '../fixtures/changeStoreSeed'
// import twoParagraphs from '../fixtures/twoParagraphs'
// import insertParagraph from '../fixtures/insertParagraph'
// import insertText from '../fixtures/insertText'

const test = module('collab/CollabEngine')

// Equivalent to the 'test-doc' that is in the backend seed.
// var testDoc = createTestArticle(twoParagraphs)

// Example changes should be something that depends on existing content, so we
// properly play the rebase scenario
// var exampleChange = createChangeset(testDoc, insertParagraph)

var documentStore = new DocumentStore()
var changeStore = new ChangeStore()

var documentEngine = new DocumentEngine({
  documentStore: documentStore,
  changeStore: changeStore
})

var fakeChange = {
  before: {
    selection: null
  },
  after: {
    selection: null,
  },
  ops: []
}

var collabEngine

function setup(cb, t) {
  var newDocumentStoreSeed = JSON.parse(JSON.stringify(documentStoreSeed))
  var newChangeStoreSeed = JSON.parse(JSON.stringify(changeStoreSeed))
  documentStore.seed(newDocumentStoreSeed, function(err) {
    if (err) return console.error(err)
    changeStore.seed(newChangeStoreSeed, function(err) {
      if (err) return console.error(err)
      collabEngine = new CollabEngine(documentEngine)
      cb(t)
    })
  })
}

function setupTest(description, fn) {
  test(description, function (t) {
    setup(fn, t)
  })
}

setupTest('New collaborator enters with latest version', function(t) {
  collabEngine.sync({
    collaboratorId: 'collab-1',
    documentId: 'test-doc',
    version: 1,
    change: fakeChange
  }, function(err, result) {
    t.isNil(err, 'Should not error')
    t.equal(result.version, 1)
    t.end()
  })
})

setupTest('New collaborator enters with an outdated version', function(t) {
  collabEngine.sync({
    collaboratorId: 'collab-1',
    documentId: 'test-doc',
    version: 0,
    change: fakeChange
  }, function(err, result) {
    t.isNil(err, 'Should not error')
    t.equal(result.version, 1)
    t.end()
  })
})

setupTest('New collaborator enters with a new fast-forward change', function(t) {
  console.error('THIS TEST NEEDS TO BE FIXED.')
  t.ok(true, 'This test has been disabled')
  t.end()
  // var done = t.async()
  // collabEngine.sync({
  //   collaboratorId: 'collab-1',
  //   documentId: 'test-doc',
  //   version: 1,
  //   change: exampleChange
  // }, function(err, result) {
  //   t.isNil(err, 'Should not error')
  //   t.equal(result.version, 2)
  //   done()
  // })
})

setupTest('New collaborator enters with a change that needs rebasing', function(t) {
  console.error('THIS TEST NEEDS TO BE FIXED.')
  t.ok(true, 'This test has been disabled')
  t.end()
  // var done = t.async()
  // // We simulate that by letting another user 'collab-2' makeing a text change
  // // that affects a later text change of 'collab-1' - the one that needs rebasing.
  // var insertTextChange1 = insertText(testDoc, {
  //   path: ['p1', 'content'],
  //   pos: 1,
  //   text: '!'
  // })
  // var insertTextChange2 = insertText(testDoc, {
  //   path: ['p1', 'content'],
  //   pos: 5,
  //   text: '$$$'
  // }); // 5 is based on version 1, after rebasing should be 6

  // collabEngine.sync({
  //   collaboratorId: 'collab-1',
  //   documentId: 'test-doc',
  //   version: 1,
  //   change: insertTextChange1
  // }, function(err, result) {
  //   t.isNil(err, 'Should not error')
  //   t.equal(result.version, 2)

  //   collabEngine.sync({
  //     collaboratorId: 'collab-2',
  //     documentId: 'test-doc',
  //     version: 1,
  //     change: insertTextChange2
  //   }, function(err, result) {
  //     t.isNil(err, 'Should not error')
  //     t.equal(result.version, 3)
  //     t.ok(result.serverChange, 'There should be a server change')
  //     t.notDeepEqual(result.change, insertTextChange2, 'Tranformed change should differ from original change')
  //     done()
  //   })
  // })
})

setupTest('Two collaborators enter', function(t) {
  collabEngine.sync({
    collaboratorId: 'collab-1',
    documentId: 'test-doc',
    version: 1,
    change: fakeChange
  }, function(err, result) {
    t.ok(result, 'connect result should be set')
    collabEngine.sync({
      collaboratorId: 'collab-2',
      documentId: 'test-doc',
      version: 1,
      change: fakeChange
    }, function(err, result) {
      t.ok(result, 'connect result should be set')
      t.isNil(err, 'Should not error')
      var collaboratorIds = collabEngine.getCollaboratorIds('test-doc', 'collab-2')
      t.deepEqual(collaboratorIds, ['collab-1'], 'Should return one collaboratorId')
      collaboratorIds = collabEngine.getCollaboratorIds('test-doc', 'collab-1')
      t.deepEqual(collaboratorIds, ['collab-2'], 'Should return one collaboratorId')
      t.end()
    })
  })
})

setupTest('Collaborator does a fast-forward sync', function(t) {
  console.error('THIS TEST NEEDS TO BE FIXED.')
  t.ok(true, 'This test has been disabled')
  t.end()
  // var done = t.async()
  // collabEngine.sync({
  //   collaboratorId: 'collab-1',
  //   documentId: 'test-doc',
  //   version: 1,
  //   change: fakeChange
  // }, function(err, result) {
  //   t.isNil(err, 'Should not error on enter')
  //   t.ok(result, 'connect should produce a result object')
  //   collabEngine.sync({
  //     collaboratorId: 'collab-1',
  //     documentId: 'test-doc',
  //     change: exampleChange,
  //     version: 1
  //   }, function(err, syncResult) {
  //     t.equal(syncResult.version, 2, 'Version should be 2 after commit')
  //     t.deepEqual(syncResult.change, exampleChange, 'Change should be untouched')
  //     done()
  //   })
  // })
})

setupTest('Collaborator does a sync that needs rebasing', function(t) {
  // We may want to use a proper seed to simulate that scenario
  t.ok(true, 'TODO: implement')
  t.end()
})

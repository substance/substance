/* eslint-disable consistent-return */
import { module } from 'substance-test'
import DocumentStore from '../../collab/DocumentStore'
import SnapshotStore from '../../collab/SnapshotStore'
import ChangeStore from '../../collab/ChangeStore'
import SnapshotEngine from '../../collab/SnapshotEngine'
import CollabServerConfigurator from '../../collab/CollabServerConfigurator'
import CollabServerPackage from '../../collab/CollabServerPackage'
import testSnapshotEngine from './testSnapshotEngine'
import testSnapshotEngineWithStore from './testSnapshotEngineWithStore'
import documentStoreSeed from '../fixtures/documentStoreSeed'
import changeStoreSeed from '../fixtures/changeStoreSeed'
import snapshotStoreSeed from '../fixtures/snapshotStoreSeed'

const test = module('collab/SnapshotEngine')

// Setup store instances

var cfg = new CollabServerConfigurator()
cfg.import(CollabServerPackage)

var documentStore = new DocumentStore()
var changeStore = new ChangeStore()
// var snapshotEngine = new SnapshotEngine({
//   configurator: cfg,
//   documentStore: documentStore,
//   changeStore: changeStore,
// })
var snapshotStore = new SnapshotStore()
var snapshotEngineWithStore = new SnapshotEngine({
  configurator: cfg,
  documentStore: documentStore,
  changeStore: changeStore,
  snapshotStore: snapshotStore
})

function setup(cb, t) {
  // Make sure we create a new seed instance, as data ops
  // are performed directly on the seed object
  var newDocumentStoreSeed = JSON.parse(JSON.stringify(documentStoreSeed))
  var newChangeStoreSeed = JSON.parse(JSON.stringify(changeStoreSeed))
  var newSnapshotStoreSeed = JSON.parse(JSON.stringify(snapshotStoreSeed))

  documentStore.seed(newDocumentStoreSeed, function(err) {
    if (err) return console.error(err)
    changeStore.seed(newChangeStoreSeed, function(err) {
      if (err) return console.error(err)
      snapshotStore.seed(newSnapshotStoreSeed, function(err) {
        if (err) return console.error(err)
        cb(t)
      })
    })
  })
}

function setupTest(description, fn) {
  test(description, function (t) {
    setup(fn, t)
  })
}

// Run the generic testsuite with an engine that does not have a store attached
// testSnapshotEngine(snapshotEngine, setupTest)
// Run the same testsuite but this time with a store
// testSnapshotEngine(snapshotEngineWithStore, setupTest)
// Run tests that are only relevant when a snapshot store is provided to the engine
testSnapshotEngineWithStore(snapshotEngineWithStore, setupTest)

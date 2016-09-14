import { module } from 'substance-test'
import DocumentStore from '../../collab/DocumentStore'
import testDocumentStore from './testDocumentStore'
import documentStoreSeed from '../fixtures/documentStoreSeed'

const test = module('collab/DocumentStore')

var store = new DocumentStore()

function setup(cb, t) {
  // Make sure we create a new seed instance, as data ops
  // are performed directly on the seed object
  var newDocumentStoreSeed = JSON.parse(JSON.stringify(documentStoreSeed))
  store.seed(newDocumentStoreSeed, function(err) {
    if (err) console.error(err)
    else cb(t)
  })
}

function setupTest(description, fn) {
  test(description, function (t) {
    setup(fn, t)
  })
}

// Runs the offical backend test suite
testDocumentStore(store, setupTest);
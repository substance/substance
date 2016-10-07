import { module } from 'substance-test'
import ChangeStore from '../../collab/ChangeStore'
import testChangeStore from './testChangeStore'
import changeStoreSeed from '../fixtures/changeStoreSeed'

const test = module('collab/ChangeStore')

var changeStore = new ChangeStore()

function setup(cb, t) {
  // Make sure we create a new seed instance, as data ops
  // are performed directly on the seed object
  var newChangeStoreSeed = JSON.parse(JSON.stringify(changeStoreSeed))
  changeStore.seed(newChangeStoreSeed, function(err) {
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
testChangeStore(changeStore, setupTest);
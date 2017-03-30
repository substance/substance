import { module } from 'substance-test'
import { ChangeStore } from 'substance'
import testChangeStore from './testChangeStore'

const test = module('collab/ChangeStore')

function createChangeStore() {
  return new ChangeStore()
}

// Runs the offical backend test suite
testChangeStore(createChangeStore, test)
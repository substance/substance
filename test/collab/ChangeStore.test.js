import { module } from 'substance-test'
import testChangeStore from './testChangeStore'
import ChangeStore from '../../collab/ChangeStore'

const test = module('collab/ChangeStore')

function createChangeStore() {
  return new ChangeStore()
}

// Runs the offical backend test suite
testChangeStore(createChangeStore, test)
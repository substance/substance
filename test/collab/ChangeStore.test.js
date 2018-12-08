import { ChangeStore } from 'substance'
import testChangeStore from './testChangeStore'

function createChangeStore () {
  return new ChangeStore()
}

// Runs the offical backend test suite
testChangeStore(createChangeStore)

import { module } from 'substance-test'
import { SnapshotStore } from 'substance'
import testSnapshotStore from './testSnapshotStore'

const test = module('collab/SnapshotStore')

function createEmptySnapshotStore () {
  return new SnapshotStore()
}

// Runs the offical backend test suite
testSnapshotStore(createEmptySnapshotStore, test)

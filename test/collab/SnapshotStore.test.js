import { module } from 'substance-test'
import testSnapshotStore from './testSnapshotStore'
import SnapshotStore from '../../collab/SnapshotStore'

const test = module('collab/SnapshotStore')

function createEmptySnapshotStore() {
  return new SnapshotStore()
}

// Runs the offical backend test suite
testSnapshotStore(createEmptySnapshotStore, test)

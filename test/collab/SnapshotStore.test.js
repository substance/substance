import { SnapshotStore } from 'substance'
import testSnapshotStore from './testSnapshotStore'

function createEmptySnapshotStore () {
  return new SnapshotStore()
}

// Runs the offical backend test suite
testSnapshotStore(createEmptySnapshotStore)

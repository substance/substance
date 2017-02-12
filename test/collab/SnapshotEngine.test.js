/* eslint-disable consistent-return */
import { module } from 'substance-test'
import SnapshotEngine from '../../collab/SnapshotEngine'
import makeStoresFixture from './makeStoresFixture'

const test = module('collab/SnapshotEngine')

function _fixture(numChanges, snapshots) {
  let stores = makeStoresFixture(numChanges, snapshots)
  return new SnapshotEngine(stores)
}

test('Should error when getting snapshot that does not exist', function(t) {
  let snapshotEngine = _fixture(0) // 0 changes, no snapshots
  snapshotEngine.getSnapshot('test-doc', 1, function(err, snapshot) {
    t.ok(err, 'There should be an error')
    t.notOk(snapshot)
    t.end()
  })
})

test('Get existing snapshot (straight)', function(t) {
  let snapshotEngine = _fixture(1, [1]) // 1 change, snapshot for v1
  snapshotEngine.getSnapshot('test-doc', 1, function(err, snapshot) {
    t.notOk(err, 'There should be no error')
    t.ok(snapshot)
    t.end()
  })
})

test('Get existing snapshot (computed from scratch)', function(t) {
  // SnapshotEngine must compute snapshot on demand
  let snapshotEngine = _fixture(2, [1]) // 1 change, snapshot for v1
  snapshotEngine.getSnapshot('test-doc', 2, function(err, snapshot) {
    t.notOk(err, 'There should be no error')
    t.ok(snapshot)
    t.end()
  })
})

test('Get existing snapshot (computed)', function(t) {
  // SnapshotEngine takes existing snapshot v1 and fetches remaining
  // changes to compute v2.
  let snapshotEngine = _fixture(2, [1]) // 1 change, snapshot for v1
  snapshotEngine.getSnapshot('test-doc', 2, function(err, snapshot) {
    t.notOk(err, 'There should be no error')
    t.ok(snapshot)
    t.end()
  })
})

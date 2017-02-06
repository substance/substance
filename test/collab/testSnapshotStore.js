import { series } from '../../util/async'

let EXAMPLE_SNAPSHOT = {test: 'test'}

function testSnapshotStore(createEmptySnapshotStore, test) {

  /*
    Save snapshot
  */
  test('Save a snapshot', (t) => {
    let snapshotStore = createEmptySnapshotStore()
    snapshotStore.saveSnapshot('test-doc', 1, EXAMPLE_SNAPSHOT, (err, snapshot) => {
      t.notOk(err, 'should not error')
      t.ok(snapshot, 'stored snapshot entry expected')
      t.end()
    })
  })

  /*
    Get snapshot
  */
  test('Retrieve snapshot for test-doc', (t) => {
    let snapshotStore = createEmptySnapshotStore()

    function _create(cb) {
      snapshotStore.saveSnapshot('test-doc', 3, EXAMPLE_SNAPSHOT, cb)
    }

    function _get(cb) {
      snapshotStore.getSnapshot('test-doc', 3, cb)
    }

    function _verify(err, snapshot) {
      t.notOk(err, 'should not error')
      t.equal(snapshot, EXAMPLE_SNAPSHOT)
      t.end()
    }

    series([_create, _get], _verify)
  })

  /*
    Get versions
  */
  test('Get all available versions for a document', (t) => {
    let snapshotStore = createEmptySnapshotStore()

    function _createV1(cb) {
      snapshotStore.saveSnapshot('test-doc', 1, EXAMPLE_SNAPSHOT, cb)
    }

    function _createV3(cb) {
      snapshotStore.saveSnapshot('test-doc', 3, EXAMPLE_SNAPSHOT, cb)
    }

    function _getVersions(cb) {
      snapshotStore.getVersions('test-doc', cb)
    }

    function _verify(err, versions) {
      t.notOk(err, 'should not error')
      t.deepEqual(versions, ['1', '3'])
      t.end()
    }

    series([_createV1, _createV3, _getVersions], _verify)
  })

  /*
    Delete snapshot
  */
  test('Delete snapshot', (t) => {
    let snapshotStore = createEmptySnapshotStore()

    function _create(cb) {
      snapshotStore.saveSnapshot('test-doc', 4, EXAMPLE_SNAPSHOT, cb)
    }

    function _delete(cb) {
      snapshotStore.deleteSnapshot('test-doc', 4, cb)
    }

    function _verify(err) {
      t.notOk(err, 'should not error')
      snapshotStore.getSnapshot('test-doc', 4, (err, snapshot) => {
        t.notOk(snapshot, 'snapshot should be undefined')
        t.notOk(err, 'should not error')
        t.end()
      })
    }

    series([_create, _delete], _verify)
  })
}

export default testSnapshotStore

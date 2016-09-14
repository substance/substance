// Please see snapshotStoreSeed.js for the used fixture data
function testSnapshotStore(store, test) {

  /*
    Store snapshot
  */
  test('Store a snapshot', function(t) {
    var snapshot = {
      documentId: 'my-doc',
      version: 1,
      data: {some: 'snaphot'}
    }

    store.saveSnapshot(snapshot, function(err, snapshot) {
      t.notOk(err, 'should not error')
      t.ok(snapshot, 'stored snapshot entry expected')
      t.end()
    })
  })

  /*
    Get snapshot
  */

  test('Retrieve snapshot for test-doc', function(t) {
    store.getSnapshot({
      documentId: 'test-doc'
    }, function(err, snapshot) {
      t.notOk(err, 'should not error')
      t.equal(snapshot.version, 1, 'Retrieved version should be 1')
      t.ok(snapshot.data, 'Snapshot should have some data')
      t.ok(snapshot.documentId, 'Snapshot should have the documentId')
      t.end()
    })
  })

  test('Retrieve snapshot for test-doc with version=1', function(t) {
    store.getSnapshot({
      documentId: 'test-doc',
      version: 1
    }, function(err, snapshot) {
      t.notOk(err, 'should not error')
      t.equal(snapshot.version, 1, 'Retrieved version should be 1')
      t.ok(snapshot.data, 'Snapshot should have some data')
      t.ok(snapshot.documentId, 'Snapshot should have the documentId')
      t.end()
    })
  })

  test('Retrieve snapshot for test-doc-2', function(t) {
    store.getSnapshot({
      documentId: 'test-doc-2'
    }, function(err, snapshot) {
      t.notOk(err, 'should not error')
      t.equal(snapshot.version, 3, 'Retrieved version should be 3')
      t.ok(snapshot.data, 'Snapshot should have some data')
      t.ok(snapshot.documentId, 'Snapshot should have the documentId')
      t.end()
    })
  })

  test('Retrieve snapshot for test-doc-2 with version=2', function(t) {
    // in the fixture there does not exist a snapshot for version 2
    store.getSnapshot({
      documentId: 'test-doc-2',
      version: 2
    }, function(err, snapshot) {
      t.notOk(err, 'should not error')
      t.notOk(snapshot, 'snapshot should be undefined')
      t.end()
    })
  })

  test('Retrieve snapshot for test-doc-2 with version=3', function(t) {
    store.getSnapshot({
      documentId: 'test-doc-2',
      version: 3
    }, function(err, snapshot) {
      t.notOk(err, 'should not error')
      t.equal(snapshot.version, 3, 'Retrieved version should be 3')
      t.ok(snapshot.data, 'Snapshot should have some data')
      t.ok(snapshot.documentId, 'Snapshot should have the documentId')
      t.end()
    })
  })
}

export default testSnapshotStore

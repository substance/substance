// Please see snapshotStoreSeed.js for the used fixture data
function testSnapshotStore(store, QUnit) {

  /*
    Store snapshot
  */
  QUnit.test('Store a snapshot', function(assert) {
    var done = assert.async();
    var snapshot = {
      documentId: 'my-doc',
      version: 1,
      data: {some: 'snaphot'}
    };

    store.saveSnapshot(snapshot, function(err, snapshot) {
      assert.notOk(err, 'should not error');
      assert.ok(snapshot, 'stored snapshot entry expected');
      done();
    });
  });

  /*
    Get snapshot
  */

  QUnit.test('Retrieve snapshot for test-doc', function(assert) {
    var done = assert.async();

    store.getSnapshot({
      documentId: 'test-doc'
    }, function(err, snapshot) {
      assert.notOk(err, 'should not error');
      assert.equal(snapshot.version, 1, 'Retrieved version should be 1');
      assert.ok(snapshot.data, 'Snapshot should have some data');
      assert.ok(snapshot.documentId, 'Snapshot should have the documentId');
      done();
    });
  });

  QUnit.test('Retrieve snapshot for test-doc with version=1', function(assert) {
    var done = assert.async();

    store.getSnapshot({
      documentId: 'test-doc',
      version: 1
    }, function(err, snapshot) {
      assert.notOk(err, 'should not error');
      assert.equal(snapshot.version, 1, 'Retrieved version should be 1');
      assert.ok(snapshot.data, 'Snapshot should have some data');
      assert.ok(snapshot.documentId, 'Snapshot should have the documentId');
      done();
    });
  });

  QUnit.test('Retrieve snapshot for test-doc-2', function(assert) {
    var done = assert.async();

    store.getSnapshot({
      documentId: 'test-doc-2'
    }, function(err, snapshot) {
      assert.notOk(err, 'should not error');
      assert.equal(snapshot.version, 3, 'Retrieved version should be 3');
      assert.ok(snapshot.data, 'Snapshot should have some data');
      assert.ok(snapshot.documentId, 'Snapshot should have the documentId');
      done();
    });
  });

  QUnit.test('Retrieve snapshot for test-doc-2 with version=2', function(assert) {
    var done = assert.async();

    // in the fixture there does not exist a snapshot for version 2
    store.getSnapshot({
      documentId: 'test-doc-2',
      version: 2
    }, function(err, snapshot) {
      assert.notOk(err, 'should not error');
      assert.notOk(snapshot, 'snapshot should be undefined');
      done();
    });
  });

  QUnit.test('Retrieve snapshot for test-doc-2 with version=3', function(assert) {
    var done = assert.async();

    store.getSnapshot({
      documentId: 'test-doc-2',
      version: 3
    }, function(err, snapshot) {
      assert.notOk(err, 'should not error');
      assert.equal(snapshot.version, 3, 'Retrieved version should be 3');
      assert.ok(snapshot.data, 'Snapshot should have some data');
      assert.ok(snapshot.documentId, 'Snapshot should have the documentId');
      done();
    });
  });
}

module.exports = testSnapshotStore;

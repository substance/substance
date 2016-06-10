// Please see snapshotStoreSeed.js for the used fixture data

function testSnapshotEngineWithPersistence(snapshotEngine, docFactory, QUnit) {
  QUnit.test('Compute a new snapshot', function(assert) {
    var done = assert.async();
    snapshotEngine.getSnapshot({documentId: 'test-doc'}, function(err, snapshot) {
      assert.notOk(err, 'There should be no error');
      assert.equal(snapshot.version, 1, 'Snapshot should be at version 1');
      done();
    });
  });

  QUnit.test('Compute latest snapshot for test-doc-2', function(assert) {
    var done = assert.async();
    snapshotEngine.getSnapshot({documentId: 'test-doc-2'}, function(err, snapshot) {
      assert.notOk(err, 'There should be no error');
      assert.equal(snapshot.version, 3, 'Snapshot should be at version 3');
      done();
    });
  });

  QUnit.test('Compute snapshot for test-doc-2 version=1', function(assert) {
    var done = assert.async();
    snapshotEngine.getSnapshot({documentId: 'test-doc-2', version: 1}, function(err, snapshot) {
      assert.notOk(err, 'There should be no error');
      assert.equal(snapshot.version, 1, 'Snapshot should be at version 1');
      done();
    });
  });

  QUnit.test('Compute snapshot for test-doc-2 version=2', function(assert) {
    var done = assert.async();
    // By requesting version 2 of test-doc-2 the snapshot will be computed based
    // on version1 + changes since then
    snapshotEngine.getSnapshot({documentId: 'test-doc-2', version: 2}, function(err, snapshot) {
      assert.notOk(err, 'There should be no error');
      assert.equal(snapshot.version, 2, 'Snapshot should be at version 3');
      done();
    });
  });

}

module.exports = testSnapshotEngineWithPersistence;
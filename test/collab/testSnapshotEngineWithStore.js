'use strict';

// Please see snapshotStoreSeed.js for the used fixture data

function testSnapshotEngineWithPersistence(snapshotEngine, docFactory, test) {
  test('Compute a new snapshot', function(t) {
    snapshotEngine.getSnapshot({documentId: 'test-doc'}, function(err, snapshot) {
      t.notOk(err, 'There should be no error');
      t.equal(snapshot.version, 1, 'Snapshot should be at version 1');
      t.end();
    });
  });

  test('Compute latest snapshot for test-doc-2', function(t) {
    snapshotEngine.getSnapshot({documentId: 'test-doc-2'}, function(err, snapshot) {
      t.notOk(err, 'There should be no error');
      t.equal(snapshot.version, 3, 'Snapshot should be at version 3');
      t.end();
    });
  });

  test('Compute snapshot for test-doc-2 version=1', function(t) {
    snapshotEngine.getSnapshot({documentId: 'test-doc-2', version: 1}, function(err, snapshot) {
      t.notOk(err, 'There should be no error');
      t.equal(snapshot.version, 1, 'Snapshot should be at version 1');
      t.end();
    });
  });

  test('Compute snapshot for test-doc-2 version=2', function(t) {
    // By requesting version 2 of test-doc-2 the snapshot will be computed based
    // on version1 + changes since then
    snapshotEngine.getSnapshot({documentId: 'test-doc-2', version: 2}, function(err, snapshot) {
      t.notOk(err, 'There should be no error');
      t.equal(snapshot.version, 2, 'Snapshot should be at version 3');
      t.end();
    });
  });

}

module.exports = testSnapshotEngineWithPersistence;
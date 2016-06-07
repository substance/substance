// Please see snapshotStoreSeed.js for the used fixture data

function testSnapshotEngine(snapshotEngine, docFactory, test) {
  test('Compute a new snapshot', function(t) {
    snapshotEngine.getSnapshot({documentId: 'test-doc'}, function(err, snapshot) {
      t.notOk(err, 'There should be no error');
      t.equal(snapshot.version, 1, 'Snapshot should be at version 1');
      t.end();
    });
  });

  test('Compute a new snapshot for 3 changes', function(t) {
    snapshotEngine.getSnapshot({documentId: 'test-doc-2'}, function(err, snapshot) {
      t.notOk(err, 'There should be no error');
      t.equal(snapshot.version, 3, 'Snapshot should be at version 3');
      t.end();
    });
  });

  test('Call getSnapshot with wrong arguments', function(t) {
    snapshotEngine.getSnapshot('test-doc', function(err) {
      t.equal(err.name, 'InvalidArgumentsError', 'Should have invalid args error');
      t.end();
    });
  });
}

module.exports = testSnapshotEngine;
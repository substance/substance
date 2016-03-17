// Please see snapshotStoreSeed.js for the used fixture data

function testSnapshotEngine(snapshotEngine, docFactory, QUnit) {
  QUnit.test('Compute a new snapshot', function(assert) {
    var done = assert.async();
    snapshotEngine.getSnapshot({documentId: 'test-doc'}, function(err, snapshot) {
      assert.notOk(err, 'There should be no error');
      assert.equal(snapshot.version, 1, 'Snapshot should be at version 1');
      done();
    });
  });

  QUnit.test('Compute a new snapshot for 3 changes', function(assert) {
    var done = assert.async();
    snapshotEngine.getSnapshot({documentId: 'test-doc-2'}, function(err, snapshot) {
      assert.notOk(err, 'There should be no error');
      assert.equal(snapshot.version, 3, 'Snapshot should be at version 3');
      done();
    });
  });

  QUnit.test('Call getSnapshot with wrong arguments', function(assert) {
    var done = assert.async();
    snapshotEngine.getSnapshot('test-doc', function(err) {
      assert.equal(err.name, 'InvalidArgumentsError', 'Should have invalid args error');
      done();
    });
  });
}

module.exports = testSnapshotEngine;
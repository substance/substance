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
}

module.exports = testSnapshotStore;

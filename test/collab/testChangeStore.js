function testChangeStore(store, QUnit) {

  QUnit.test("Return version of test-doc", function(assert) {
    var done = assert.async();
    store.getVersion('test-doc', function(err, version) {
      assert.notOk(err, 'Should not error');
      assert.equal(version, 1, 'Document version should equals 1');
      done();
    });
  });

  QUnit.test("Return changes of test-doc", function(assert) {
    var done = assert.async();
    var args = {
      documentId: 'test-doc',
      sinceVersion: 0
    };
    store.getChanges(args, function(err, result) {
      assert.notOk(err, 'Should not error');
      assert.equal(result.changes.length, 1, 'Should be only one change');
      assert.equal(result.version, 1, 'Document version should equals 1');
      done();
    });
  });

  QUnit.test('Add a new change to test-doc', function(assert) {
    var done = assert.async();
    var args = {
      documentId: 'test-doc',
      change: {'some': 'change'}
    };
    store.addChange(args, function(err, version) {
      assert.notOk(err, 'Should not error');
      assert.equal(version, 2, 'Version should have been incremented by 1');
      store.getChanges({
        documentId: 'test-doc',
        sinceVersion: 0
      }, function(err, result) {
        assert.equal(result.changes.length, 2, 'There should be two changes in the db');
        assert.equal(result.version, 2, 'New version should be 2');
        done();
      });
    });
  });
}

module.exports = testChangeStore;
function testChangeStore(store, QUnit) {
  /*
    Create
  */

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

  QUnit.test('Should only create changes associated with a documentId', function(assert) {
    var done = assert.async();
    store.addChange({'some': 'change'}, function(err) {
      assert.equal(err.name, 'ChangeStore.CreateError');
      done();
    });
  });

  /*
    Read
  */

  QUnit.test("Return changes of test-doc", function(assert) {
    var done = assert.async();
    var args = {
      documentId: 'test-doc',
      sinceVersion: 0
    };
    store.getChanges(args, function(err, result) {
      assert.notOk(err, 'Should not error');
      assert.equal(result.changes.length, 1, 'Should be only one change');
      assert.equal(result.version, 1, 'Document version should be 1');
      done();
    });
  });

  QUnit.test("Return all changes of test-doc-2 by not specifying sinceVersion", function(assert) {
    var done = assert.async();
    var args = {
      documentId: 'test-doc-2'
    };
    store.getChanges(args, function(err, result) {
      assert.notOk(err, 'Should not error');
      assert.equal(result.changes.length, 3, 'Should be only one change');
      assert.equal(result.version, 3, 'Document version should be 1');
      done();
    });
  });

  QUnit.test("Should return no changes if sinceVersion = actual version", function(assert) {
    var done = assert.async();
    var args = {
      documentId: 'test-doc-2',
      sinceVersion: 3
    };
    store.getChanges(args, function(err, result) {
      assert.notOk(err, 'Should not error');
      assert.equal(result.changes.length, 0, 'Should have zero changes');
      assert.equal(result.version, 3, 'Document version should be 1');
      done();
    });
  });

  QUnit.test("Return changes of test-doc-2 between version 1 and version 2", function(assert) {
    var done = assert.async();
    var args = {
      documentId: 'test-doc-2',
      sinceVersion: 1,
      toVersion: 2
    };
    store.getChanges(args, function(err, result) {
      assert.notOk(err, 'Should not error');
      assert.equal(result.changes.length, 1, 'Should be only one change');
      assert.equal(result.version, 3, 'Latest version should be 3');
      done();
    });
  });

  QUnit.test("Invalid use of getChanges sinceVersion argument", function(assert) {
    var done = assert.async();
    var args = {
      documentId: 'test-doc',
      sinceVersion: -5
    };
    store.getChanges(args, function(err) {
      assert.equal(err.name, 'ChangeStore.ReadError', 'Should give a read error as invalid version provided');
      done();
    });
  });

  QUnit.test("Invalid use of getChanges toVersion argument", function(assert) {
    var done = assert.async();
    var args = {
      documentId: 'test-doc',
      toVersion: -3
    };
    store.getChanges(args, function(err) {
      assert.equal(err.name, 'ChangeStore.ReadError', 'Should give a read error as invalid version provided');
      done();
    });
  });

  QUnit.test("Invalid use of getChanges version arguments", function(assert) {
    var done = assert.async();
    var args = {
      documentId: 'test-doc',
      sinceVersion: 2,
      toVersion: 1
    };
    store.getChanges(args, function(err) {
      assert.equal(err.name, 'ChangeStore.ReadError', 'Should give a read error as invalid version provided');
      done();
    });
  });

  /*
    Version
  */

  QUnit.test("Return version of test-doc", function(assert) {
    var done = assert.async();
    store.getVersion('test-doc', function(err, version) {
      assert.notOk(err, 'Should not error');
      assert.equal(version, 1, 'Document version should equal 0');
      done();
    });
  });

  QUnit.test("Return version=0 if no changes are found", function(assert) {
    var done = assert.async();
    store.getVersion('not-existing-doc', function(err, version) {
      assert.notOk(err, 'Should not error');
      assert.equal(version, 0, 'Document version should equal 0');
      done();
    });
  });

  /*
    Delete
  */

  QUnit.test("Delete changes of test-doc", function(assert) {
    var done = assert.async();
    store.deleteChanges('test-doc', function(err, changeCount) {
      assert.notOk(err, 'Should not error');
      assert.equal(changeCount, 1, 'There should be 1 deleted change');
      store.getChanges({
        documentId: 'test-doc',
        sinceVersion: 0
      }, function(err, result) {
        assert.notOk(err, 'Should not error');
        assert.equal(result.changes.length, 0, 'There should not be changes anymore');
        assert.equal(result.version, 0, 'Document version should be 0');
        done();
      });
    });
  });

  QUnit.test("Delete changes of not existing doc", function(assert) {
    var done = assert.async();
    store.deleteChanges('not-existing-doc', function(err, changeCount) {
      assert.notOk(err, 'Should not error');
      assert.equal(changeCount, 0, 'There should be 0 deleted changes');
      done();
    });
  });

}

module.exports = testChangeStore;
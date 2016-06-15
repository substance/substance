'use strict';

function testChangeStore(store, test) {
  /*
    Create
  */

  test('Add a new change to test-doc', function(t) {
    var args = {
      documentId: 'test-doc',
      change: {
        ops: [{some: 'operation'}],
        // the info object is meant to store any custom information
        info: {
          userId: 'testuser'
        }
      }
    };
    store.addChange(args, function(err, version) {
      t.notOk(err, 'Should not error');
      t.equal(version, 2, 'Version should have been incremented by 1');
      store.getChanges({
        documentId: 'test-doc',
        sinceVersion: 0
      }, function(err, result) {
        t.equal(result.changes.length, 2, 'There should be two changes in the db');
        t.equal(result.version, 2, 'New version should be 2');
        t.equal(result.changes[1].info.userId, 'testuser', 'info.userId should be "testuser"');
        t.end();
      });
    });
  });

  test('Should only create changes associated with a documentId', function(t) {
    store.addChange({'some': 'change'}, function(err) {
      t.equal(err.name, 'ChangeStore.CreateError');
      t.end();
    });
  });

  /*
    Read
  */

  test("Return changes of test-doc", function(t) {
    var args = {
      documentId: 'test-doc',
      sinceVersion: 0
    };
    store.getChanges(args, function(err, result) {
      t.notOk(err, 'Should not error');
      t.equal(result.changes.length, 1, 'Should be only one change');
      t.equal(result.version, 1, 'Document version should be 1');
      t.end();
    });
  });

  test("Return all changes of test-doc-2 by not specifying sinceVersion", function(t) {
    var args = {
      documentId: 'test-doc-2'
    };
    store.getChanges(args, function(err, result) {
      t.notOk(err, 'Should not error');
      t.equal(result.changes.length, 1, 'Should be only one change');
      t.equal(result.version, 1, 'Document version should be 1');
      t.end();
    });
  });

  test("Should return no changes if sinceVersion = actual version", function(t) {
    var args = {
      documentId: 'test-doc-2',
      sinceVersion: 1
    };
    store.getChanges(args, function(err, result) {
      t.notOk(err, 'Should not error');
      t.equal(result.changes.length, 0, 'Should have zero changes');
      t.equal(result.version, 1, 'Document version should be 1');
      t.end();
    });
  });

  test("Return changes of test-doc-2 between version 1 and version 2", function(t) {
    var args = {
      documentId: 'test-doc-2',
      change: {
        ops: [{some: 'operation'}],
        info: {
          userId: 'testuser'
        }
      }
    };
    // Add two changes
    store.addChange(args, function() {
      store.addChange(args, function() {
        var args = {
          documentId: 'test-doc-2',
          sinceVersion: 1,
          toVersion: 2
        };
        store.getChanges(args, function(err, result) {
          t.notOk(err, 'Should not error');
          t.equal(result.changes.length, 1, 'Should be only one change');
          t.equal(result.version, 3, 'Latest version should be 3');
          t.end();
        });
      });
    });
  });

  test("Invalid use of getChanges sinceVersion argument", function(t) {
    var args = {
      documentId: 'test-doc',
      sinceVersion: -5
    };
    store.getChanges(args, function(err) {
      t.equal(err.name, 'ChangeStore.ReadError', 'Should give a read error as invalid version provided');
      t.end();
    });
  });

  test("Invalid use of getChanges toVersion argument", function(t) {
    var args = {
      documentId: 'test-doc',
      toVersion: -3
    };
    store.getChanges(args, function(err) {
      t.equal(err.name, 'ChangeStore.ReadError', 'Should give a read error as invalid version provided');
      t.end();
    });
  });

  test("Invalid use of getChanges version arguments", function(t) {
    var args = {
      documentId: 'test-doc',
      sinceVersion: 2,
      toVersion: 1
    };
    store.getChanges(args, function(err) {
      t.equal(err.name, 'ChangeStore.ReadError', 'Should give a read error as invalid version provided');
      t.end();
    });
  });

  /*
    Version
  */

  test("Return version of test-doc", function(t) {
    store.getVersion('test-doc', function(err, version) {
      t.notOk(err, 'Should not error');
      t.equal(version, 1, 'Document version should equal 0');
      t.end();
    });
  });

  test("Return version=0 if no changes are found", function(t) {
    store.getVersion('not-existing-doc', function(err, version) {
      t.notOk(err, 'Should not error');
      t.equal(version, 0, 'Document version should equal 0');
      t.end();
    });
  });

  /*
    Delete
  */

  test("Delete changes of test-doc", function(t) {
    store.deleteChanges('test-doc', function(err, changeCount) {
      t.notOk(err, 'Should not error');
      t.equal(changeCount, 1, 'There should be 1 deleted change');
      store.getChanges({
        documentId: 'test-doc',
        sinceVersion: 0
      }, function(err, result) {
        t.notOk(err, 'Should not error');
        t.equal(result.changes.length, 0, 'There should not be changes anymore');
        t.equal(result.version, 0, 'Document version should be 0');
        t.end();
      });
    });
  });

  test("Delete changes of not existing doc", function(t) {
    store.deleteChanges('not-existing-doc', function(err, changeCount) {
      t.notOk(err, 'Should not error');
      t.equal(changeCount, 0, 'There should be 0 deleted changes');
      t.end();
    });
  });

}

module.exports = testChangeStore;
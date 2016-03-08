// TODO:
// - add tests for getChanges with different since configurations

function testDocumentStore(store, QUnit) {

  // Document API
  // --------------------

  QUnit.test("Test if seed db has a valid document test-doc", function(assert) {
    var done = assert.async();
    store.getDocument('test-doc', function(err, doc) {
      assert.ok(doc, 'valid doc snapshot expected');
      assert.ok(doc.data, 'should have document data attached');
      assert.equal(doc.version, 1, 'doc version should be 1');
      assert.equal(doc.userId, '1', 'userId should be "1"');
      done();
    });
  });

  QUnit.test('Create a new document', function(assert) {
    var done = assert.async();
    var args = {
      documentId: 'new-doc',
      schemaName: 'prose-article',
      userId: '2'
    };
    store.createDocument(args, function(err, doc) {
      assert.ok(doc, 'valid doc snapshot expected');
      done();
    });
  });

  QUnit.test('Delete document', function(assert) {
    var done = assert.async();
    store.deleteDocument('test-doc', function(err) {
      assert.ok(!err, 'Should delete a document');

      store.getDocument('test-doc', function(err, doc) {
        assert.ok(err, 'Should print an error that document does not exist');
        assert.isNullOrUndefined(doc, 'doc should be undefined');

        // Test if there are still changes for that doc after deletion
        var args = {
          documentId: 'test-doc',
          sinceVersion: 0
        };
        store.getChanges(args, function(err, result) {
          assert.ok(err, 'Should print an error that document does not exist');
          done();
        });
      });
    });
  });

  QUnit.test('List documents', function(assert) {
    var done = assert.async();
    store.listDocuments({}, function(err, documents) {
      assert.notOk(err, 'Should not error');
      assert.equal(documents.length, 1, 'There should be one document returned');
      assert.equal(documents[0].userId, '1', 'First doc should have userId "1"');
      assert.equal(documents[0].documentId, 'test-doc', 'documentId should be "test-doc"');
      done();
    });
  });

  QUnit.test('List documents with matching filter', function(assert) {
    var done = assert.async();
    store.listDocuments({userId: '1'}, function(err, documents) {
      assert.notOk(err, 'Should not error');
      assert.equal(documents.length, 1, 'There should be one document returned');
      assert.equal(documents[0].userId, '1', 'First doc should have userId "1"');
      assert.equal(documents[0].documentId, 'test-doc', 'documentId should be "test-doc"');
      done();
    });
  });

  QUnit.test('List documents with filter that does not match', function(assert) {
    var done = assert.async();
    store.listDocuments({userId: 'userx'}, function(err, documents) {
      assert.notOk(err, 'Should not error');
      assert.equal(documents.length, 0, 'There should be no matches');
      done();
    });
  });

  // Changes Store API (Required by CollabEngine)
  // --------------------

  QUnit.test("Test if seed db test-doc has the right version", function(assert) {
    var done = assert.async();
    store.getVersion('test-doc', function(err, version) {
      assert.notOk(err, 'Should not error');
      assert.equal(version, 1, 'Document version should equals 1');
      done();
    });
  });

  QUnit.test("Test if seed db test-doc has valid changes", function(assert) {
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

  QUnit.test('Should not allow adding a change to non existing changeset', function(assert) {
    var done = assert.async();
    var args = {
      documentId: 'some-non-existent-doc',
      change: {'some': 'change'},
      userId: '1'
    };
    store.addChange(args, function(err) {
      assert.ok(err, 'Adding change to non existent doc should error');
      done();
    });
  });

  QUnit.test('Add a change to an existing doc', function(assert) {
    var done = assert.async();
    var args = {
      documentId: 'test-doc',
      change: {'some': 'change'},
      userId: '1'
    };
    store.addChange(args, function(err, version) {
      assert.notOk(err, 'Should not error');
      assert.equal(version, 2, 'Version should have been incremented by 1');
      var args = {
        documentId: 'test-doc',
        sinceVersion: 0
      };

      store.getChanges(args, function(err, result) {
        assert.equal(result.changes.length, 2, 'There should be two changes in the db');
        assert.equal(result.version, 2, 'New version should be 2');
        done();
      });
    });
  });

}

module.exports = runBackendTests;

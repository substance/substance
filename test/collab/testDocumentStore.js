// TODO:
// - add tests for getChanges with different since configurations

function testDocumentStore(store, QUnit) {

  // Document API
  // --------------------

  QUnit.test("Test if seed db has a valid document test-doc", function(assert) {
    var done = assert.async();
    store.getDocument('test-doc', function(err, doc) {
      assert.ok(doc, 'doc data expected');
      assert.equal(doc.documentId, 'test-doc', 'documentId should be "test-doc"');
      assert.equal(doc.schemaName, 'prose-article', 'schemaName should be prose-article');
      assert.equal(doc.schemaVersion, '1.0.0', 'schemaVersion should be 1.0.0');
      assert.equal(doc.version, 1, 'doc version should be 1');
      done();
    });
  });

  QUnit.test('Create a new document', function(assert) {
    var done = assert.async();
    var newDoc = {
      documentId: 'new-doc',
      schemaName: 'prose-article',
      schemaVersion: '1.0.0',
      info: {
        custom: 'some custom data'
      }
    };

    store.createDocument(newDoc, function(err, doc) {
      assert.ok(doc, 'valid doc entry expected');
      assert.equal(doc.schemaName, 'prose-article', 'schemaName should be "prose-article"');
      done();
    });
  });

  QUnit.test('Create a new document that already exists', function(assert) {
    var done = assert.async();
    var newDoc = {
      documentId: 'test-doc',
      schemaName: 'prose-article',
      schemaVersion: '1.0.0'
    };

    store.createDocument(newDoc, function(err, doc) {
      assert.ok(err, 'Trying to overwrite an existing doc should error');
      assert.isNullOrUndefined(doc, 'doc should be undefined');
      done();
    });
  });

  QUnit.test('Delete document', function(assert) {
    var done = assert.async();

    store.deleteDocument('test-doc', function(err, doc) {
      assert.notOk(err, 'There should be no error');
      assert.ok(doc, 'Deleted doc entry should be returned');

      store.getDocument('test-doc', function(err, doc) {
        assert.ok(err, 'Should return an error that document does not exist');
        assert.isNullOrUndefined(doc, 'doc should be undefined');
        done();
      });
    });
  });

  QUnit.test('Delete document that does not exist', function(assert) {
    var done = assert.async();
    store.deleteDocument('doc-x', function(err, doc) {
      assert.ok(err, 'There should be an error');
      done();
    });
  });
}

module.exports = testDocumentStore;

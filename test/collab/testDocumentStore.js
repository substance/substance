function testDocumentStore(store, QUnit) {

  /*
    Create
  */

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
      assert.equal(err.name, 'DocumentStore.CreateError', 'Should give a create error');
      assert.isNullOrUndefined(doc, 'doc should be undefined');
      done();
    });
  });

  /*
    Read
  */

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

  QUnit.test("Get document that does not exist", function(assert) {
    var done = assert.async();
    store.getDocument('not-there-doc', function(err, doc) {
      assert.equal(err.name, 'DocumentStore.ReadError', 'Should give a read error for deleted document');
      done();
    });
  });

  /*
    Update
  */

  QUnit.test('Update a document', function(assert) {
    var done = assert.async();
    var updateProps = {
      schemaName: 'blog-article',
      schemaVersion: '2.0.0',
    };
    store.updateDocument('test-doc', updateProps, function(err, doc) {
      assert.notOk(err, 'There should be no error');
      assert.ok(doc, 'valid doc entry expected');
      assert.equal(doc.schemaName, 'blog-article', 'schemaName should be "blog-article" after update');
      assert.equal(doc.schemaVersion, '2.0.0', 'schemaVersion should be "2.0.0" after update');
      done();
    });
  });

  QUnit.test('Update a document that does not exist', function(assert) {
    var done = assert.async();
    store.updateDocument('doc-x', {schemaName: 'blog-article'}, function(err, doc) {
      assert.equal(err.name, 'DocumentStore.UpdateError', 'should return an update error.');
      assert.isNullOrUndefined(doc, 'doc should be undefined');
      done();
    });
  });

  /*
    Delete
  */

  QUnit.test('Delete document', function(assert) {
    var done = assert.async();
    store.deleteDocument('test-doc', function(err, doc) {
      assert.notOk(err, 'There should be no error');
      assert.ok(doc, 'Deleted doc entry should be returned');
      assert.equal(doc.schemaName, 'prose-article', 'doc schemaName should be "prose-article"');
      
      store.getDocument('test-doc', function(err, doc) {
        assert.equal(err.name, 'DocumentStore.ReadError', 'Should give a read error for deleted document');
        assert.isNullOrUndefined(doc, 'doc should be undefined');
        done();
      });
    });
  });

  QUnit.test('Delete document that does not exist', function(assert) {
    var done = assert.async();
    store.deleteDocument('doc-x', function(err, doc) {
      assert.equal(err.name, 'DocumentStore.DeleteError', 'Should give a delete error');
      assert.isNullOrUndefined(doc, 'doc should be undefined');
      done();
    });
  });
}

module.exports = testDocumentStore;

function testDocumentStore(store, test) {

  /*
    Create
  */

  test('Create a new document', function(t) {
    var newDoc = {
      documentId: 'new-doc',
      schemaName: 'test-article',
      info: {
        custom: 'some custom data'
      }
    }

    store.createDocument(newDoc, function(err, doc) {
      t.ok(doc, 'valid doc entry expected')
      t.equal(doc.schemaName, 'test-article', 'schemaName should be "test-article"')
      t.end()
    })
  })

  test('Create a new document without providing a documentId', function(t) {
    var newDoc = {
      schemaName: 'test-article'
    }
    store.createDocument(newDoc, function(err, doc) {
      t.ok(doc, 'valid doc entry expected')
      t.ok(doc.documentId, 'Auto-generated documentId should be returned')
      t.end()
    })
  })

  test('Create a new document that already exists', function(t) {
    var newDoc = {
      documentId: 'test-doc',
      schemaName: 'test-article'
    }

    store.createDocument(newDoc, function(err, doc) {
      t.equal(err.name, 'DocumentStore.CreateError', 'Should give a create error')
      t.isNil(doc, 'doc should be undefined')
      t.end()
    })
  })

  /*
    Read
  */

  test("Test if seed db has a valid document test-doc", function(t) {
    store.getDocument('test-doc', function(err, doc) {
      t.ok(doc, 'doc data expected')
      t.equal(doc.documentId, 'test-doc', 'documentId should be "test-doc"')
      t.equal(doc.schemaName, 'test-article', 'schemaName should be test-article')
      t.equal(doc.version, 1, 'doc version should be 1')
      t.end()
    })
  })

  test("Get document that does not exist", function(t) {
    store.getDocument('not-there-doc', function(err) {
      t.equal(err.name, 'DocumentStore.ReadError', 'Should give a read error for deleted document')
      t.end()
    })
  })

  /*
    Update
  */

  test('Update a document', function(t) {
    var updateProps = {
      schemaName: 'blog-article'
    }
    store.updateDocument('test-doc', updateProps, function(err, doc) {
      t.notOk(err, 'There should be no error')
      t.ok(doc, 'valid doc entry expected')
      t.equal(doc.schemaName, 'blog-article', 'schemaName should be "blog-article" after update')
      t.end()
    })
  })

  test('Update a document that does not exist', function(t) {
    store.updateDocument('doc-xyz', {schemaName: 'blog-article'}, function(err, doc) {
      t.equal(err.name, 'DocumentStore.UpdateError', 'should return an update error.')
      t.isNil(doc, 'doc should be undefined')
      t.end()
    })
  })

  /*
    Delete
  */

  test('Delete document', function(t) {
    store.deleteDocument('test-doc', function(err, doc) {
      t.notOk(err, 'There should be no error')
      t.ok(doc, 'Deleted doc entry should be returned')
      t.equal(doc.schemaName, 'test-article', 'doc schemaName should be "test-article"')

      store.getDocument('test-doc', function(err, doc) {
        t.equal(err.name, 'DocumentStore.ReadError', 'Should give a read error for deleted document')
        t.isNil(doc, 'doc should be undefined')
        t.end()
      })
    })
  })

  test('Delete document that does not exist', function(t) {
    store.deleteDocument('doc-x', function(err, doc) {
      t.equal(err.name, 'DocumentStore.DeleteError', 'Should give a delete error')
      t.isNil(doc, 'doc should be undefined')
      t.end()
    })
  })

  /*
    Exists
  */

  test('documentExists should return true for existing document', function(t) {
    store.documentExists('test-doc', function(err, exists) {
      t.notOk(err, 'There should be no error')
      t.ok(exists, 'exists should be true')
      t.end()
    })
  })

  test('documentExists should return false for non-existing document', function(t) {
    store.documentExists('not-existing-doc', function(err, exists) {
      t.notOk(err, 'There should be no error')
      t.notOk(exists, 'exists should be false')
      t.end()
    })
  })

}

export default testDocumentStore

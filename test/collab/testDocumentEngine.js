function testDocumentEngine(documentEngine, test) {

  // Document API
  // --------------------

  test("Test if seed db has a valid document test-doc", function(t) {
    documentEngine.getDocument({documentId: 'test-doc'}, function(err, doc) {
      t.ok(doc, 'valid doc snapshot expected')
      t.ok(doc.data, 'should have document data attached')
      t.equal(doc.version, 1, 'doc version should be 1')
      t.end()
    })
  })

  test('Create a new document', function(t) {
    documentEngine.createDocument({
      documentId: 'new-doc',
      schemaName: 'prose-article'
    }, function(err, doc) {
      t.ok(doc.data, 'valid doc snapshot expected')
      t.end()
    })
  })

  test('Create a new document without documentId provided', function(t) {
    documentEngine.createDocument({
      schemaName: 'prose-article'
    }, function(err, doc) {
      t.ok(doc.data, 'valid doc snapshot expected')
      t.ok(doc.documentId, 'Auto-generated documentId expected')
      t.end()
    })
  })

  test('Delete document', function(t) {
    documentEngine.deleteDocument('test-doc', function(err) {
      t.ok(!err, 'Should delete a document')
      documentEngine.getDocument({documentId: 'test-doc'}, function(err, doc) {
        t.ok(err, 'Should print an error that document does not exist')
        t.isNil(doc, 'doc should be undefined')

        // Test if there are still changes for that doc after deletion
        var args = {
          documentId: 'test-doc',
          sinceVersion: 0
        }
        documentEngine.getChanges(args, function(err) {
          t.ok(err, 'Should print an error that document does not exist')
        })
        documentEngine.changeStore.getChanges(args, function(err, result) {
          t.equal(result.changes.length, 0, 'Should be no changes')
          t.equal(result.version, 0, 'Document version should equals 0')
          t.end()
        })
      })
    })
  })

  // Changes Store API (Required by CollabEngine)
  // --------------------

  test("Test if seed db test-doc has the right version", function(t) {
    documentEngine.getVersion('test-doc', function(err, version) {
      t.notOk(err, 'Should not error')
      t.equal(version, 1, 'Document version should equals 1')
      t.end()
    })
  })

  test("Test if seed db test-doc has valid changes", function(t) {
    var args = {
      documentId: 'test-doc',
      sinceVersion: 0
    }
    documentEngine.getChanges(args, function(err, result) {
      t.notOk(err, 'Should not error')
      t.equal(result.changes.length, 1, 'Should be only one change')
      t.equal(result.version, 1, 'Document version should equals 1')
      t.end()
    })
  })

  test('Should not allow adding a change to non existing changeset', function(t) {
    documentEngine.addChange({
      documentId: 'some-non-existent-doc',
      change: {'some': 'change'}
    }, function(err) {
      t.ok(err, 'Adding change to non existent doc should error')
      t.end()
    })
  })

  test('Add a change to an existing doc', function(t) {
    documentEngine.addChange({
      documentId: 'test-doc',
      change: {'some': 'change'}
    }, function(err, version) {
      t.notOk(err, 'Should not error')
      t.equal(version, 2, 'Version should have been incremented by 1')
      var args = {
        documentId: 'test-doc',
        sinceVersion: 0
      }
      documentEngine.getChanges(args, function(err, result) {
        t.equal(result.changes.length, 2, 'There should be two changes in the db')
        t.equal(result.version, 2, 'New version should be 2')

        documentEngine.documentStore.getDocument('test-doc', function(err, doc) {
          t.equal(doc.version, 2, 'Version of document record should be 2')
          t.end()
        })
      })
    })
  })
}

export default testDocumentEngine
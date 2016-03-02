
function runBackendTests(backend, QUnit) {

  // Test Initial Seed validity
  // --------------------

  QUnit.test("Test if seed db has a valid document test-doc", function(assert) {
    var done = assert.async();
    backend.getDocument('test-doc', function(err, doc) {
      assert.ok(doc, 'valid doc snapshot expected');
      done();
    });
  });

  QUnit.test("Test if seed db test-doc has the right version", function(assert) {
    var done = assert.async();
    backend.getVersion('test-doc', function(err, version) {
      assert.notOk(err, 'Should not error');
      assert.equal(version, 1, 'Document version should equals 1');
      done();
    });
  });

  QUnit.test("Test if seed db test-doc has valid changes", function(assert) {
    var done = assert.async();
    backend.getChanges('test-doc', 0, function(err, version, changes) {
      assert.notOk(err, 'Should not error');
      assert.equal(changes.length, 1, 'Should be only one change');
      assert.equal(version, 1, 'Document version should equals 1');
      done();
    });
  });

  // Test full API
  // --------------------

  QUnit.test('Create a new document', function(assert) {
    var done = assert.async();
    backend.createDocument('new-doc', 'prose-article', function(err, doc) {
      assert.ok(doc, 'valid doc snapshot expected');
      done();
    });
  });

  QUnit.test('Delete document', function(assert) {
    var done = assert.async();
    backend.deleteDocument('new-doc', function(err) {
      assert.ok(!err, 'Should delete a document');
      done();
    });
  });

  QUnit.test('Should not allow adding a change to non existing changeset', function(assert) {
    var done = assert.async();
    backend.addChange('some-non-existent-doc', {'some': 'change'}, null, function(err) {
      assert.ok(err, 'Adding change to non existent doc should error');
      done();
    });
  });

  QUnit.test('Add a change to an existing doc', function(assert) {
    var done = assert.async();
    backend.addChange('test-doc', {'some': 'change'}, null, function(err, version) {
      assert.notOk(err, 'Should not error');
      assert.equal(version, 2, 'Version should have been incremented by 1');

      backend.getChanges('test-doc', 0, function(err, version, changes) {
        assert.equal(changes.length, 2, 'There should be two changes in the db');
        assert.equal(version, 2, 'New version should be 2');
        done();
      });
    });
  });
}

module.exports = runBackendTests;

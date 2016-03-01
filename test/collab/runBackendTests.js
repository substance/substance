// Test Initial Seed validity
// --------------------

function runBackendTests(backend, QUnit) {

  QUnit.test("Test if seed db has a valid document test-doc", function(assert) {
    var done = assert.async();
    backend.getDocument('test-doc', function(err, doc) {
      console.log('article', doc);
      assert.ok(doc, 'valid doc snapshot expected');
      done();
    });
  });

  QUnit.test("Test if seed db test-doc has the right version", function(assert) {
    var done = assert.async();
    backend.getVersion('test-doc', function(err, version) {
      assert.notOk(err, 'Should not error');
      assert.equal(1, version);
      done();
    });
  });

  QUnit.test("Check if seed db test-doc has valid changes", function(assert) {
    var done = assert.async();
    backend.getChanges('test-doc', 0, function(err, version, changes) {
      assert.notOk(err, 'Should not error');
      assert.equal(1, changes.length);
      assert.equal(1, version);
      done();
    });
  });

  // Test full API
  // --------------------

  QUnit.test('Create a new document', function(assert) {
    var done = assert.async();
    backend.createDocument('new-doc', function(err, doc) {
      assert.ok(doc, 'valid doc snapshot expected');
      done();
    });
  });

  QUnit.test('Delete document', function(assert) {
    var done = assert.async();
    backend.deleteDocument('new-doc', function(err) {
      assert.ok(!err, 'There should not be no error on deletion');
      done();
    });
  });

  // TODO: Use a real change!
  QUnit.test('Should not allow adding a change to non existing changeset', function(assert) {
    var done = assert.async();
    backend.addChange('some-nonexistent-doc', {'some': 'change'}, null, function(err, version) {
      assert.ok(err, 'There should be an error');
      done();
    });
  });

  QUnit.test('Add a change to an existing doc', function(assert) {
    var done = assert.async();
    backend.addChange('test-doc', {'some': 'change'}, null, function(err, version) {
      assert.notOk(err, 'Should not error');
      assert.equal(2, version);
      done();
    });
  });
};

module.exports = runBackendTests;

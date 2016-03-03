
function runBackendTests(backend, QUnit) {

  // Document API
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

  QUnit.test('Create a new document', function(assert) {
    var done = assert.async();
    backend.createDocument('new-doc', 'prose-article', 'user2', function(err, doc) {
      assert.ok(doc, 'valid doc snapshot expected');
      done();
    });
  });

  QUnit.test('Delete document', function(assert) {
    var done = assert.async();
    backend.deleteDocument('test-doc', function(err) {
      assert.ok(!err, 'Should delete a document');

      backend.getDocument('test-doc', function(err, doc) {
        assert.ok(err, 'Should print an error that document does not exist');
        assert.isNullOrUndefined(doc, 'doc should be undefined');

        // Test if there are still changes for that doc after deletion
        backend.getChanges('test-doc', 0, function(err, version, changes) {
          assert.ok(err, 'Should print an error that document does not exist');
          assert.isNullOrUndefined(version, 'version should be undefined');
          assert.isNullOrUndefined(changes, 'changes should be undefined');
          done();
        });
      });
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

  // Users API
  // --------------------

  QUnit.test('Get user', function(assert) {
    var done = assert.async();
    backend.getUser('1', function(err, user) {
      assert.notOk(err, 'Getting an existing user should not error');
      assert.equal(user.userId, '1', 'userId should be "1"');
      done();
    });
  });

  QUnit.test('Get user that does not exist', function(assert) {
    var done = assert.async();
    backend.getUser('userx', function(err, user) {
      assert.ok(err, 'Getting a user that does not exist should error');
      assert.isNullOrUndefined(user, 'user should be undefined');
      done();
    });
  });

  QUnit.test('Create a new user', function(assert) {
    var done = assert.async();
    backend.createUser({'userId': '3'}, function(err, newUser) {
      assert.notOk(err, 'Creating a new user should not error');
      assert.equal(newUser.userId, '3', 'New user should have userId 3');

      // Let's see if the user is now really in the db
      backend.getUser('3', function(err, user) {
        assert.notOk(err, 'Getting user after creation should not error');
        assert.equal(user.userId, '3', 'userId should be "3"');
        done();
      });
    });
  });

  QUnit.test('Create a new user that already exists', function(assert) {
    var done = assert.async();
    backend.createUser({'userId': '1'}, function(err, newUser) {
      assert.ok(err, 'Creating a new user should error');
      assert.isNullOrUndefined(newUser, 'newUser should be undefined');
      done();
    });
  });

  // Sessions API
  // --------------------

  QUnit.test('Get an existing session', function(assert) {
    var done = assert.async();
    backend.getSession('user1token', function(err, session) {
      assert.equal(session.sessionToken, 'user1token', 'Session token should match');
      assert.equal(session.user.userId, '1', 'Session should be associated with user1');
      done();
    });
  });

  QUnit.test('Get a non-existent session', function(assert) {
    var done = assert.async();
    backend.getSession('user1token', function(err, session) {
      assert.equal(session.sessionToken, 'user1token', 'Session token should match');
      assert.equal(session.user.userId, '1', 'Session should be associated with user1');
      done();
    });
  });

  QUnit.test('Authenticate based on existing session token', function(assert) {
    var done = assert.async();
    backend.authenticate({sessionToken: 'user1token'}, function(err, session) {
      assert.notOk(err, 'Authenticating with an existing session token should not error');
      assert.notEqual(session.sessionToken, 'user1token', 'There should be a new token assigned.');
      assert.equal(session.user.userId, '1', 'New should be associated with user1');

      backend.getSession('user1token', function(err, session) {
        assert.ok(err, 'Looking for old session should error');
        assert.isNullOrUndefined(session, 'session should be undefined');
        done();
      });
    });
  });

  QUnit.test('Delete existing session', function(assert) {
    var done = assert.async();
    backend.deleteSession('user1token', function(err) {
      assert.notOk(err, 'Deleting an existing session should not error');
      backend.getSession('user1token', function(err, session) {
        assert.ok(err, 'Looking for old session should error');
        assert.isNullOrUndefined(session, 'session should be undefined');
        done();
      });
    });
  });

}

module.exports = runBackendTests;

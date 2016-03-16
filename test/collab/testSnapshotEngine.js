function testSnapshotEngine(snapshotEngine, docFactory, QUnit) {
  var insertText = require('../fixtures/collab/insertText');

  function addChanges(cb) {
    // insert works on documents that have a p1.content text property
    var testDoc = docFactory.createArticle();

    var insertTextChange1 = insertText(testDoc, 1, '!');
    var insertTextChange2 = insertText(testDoc, 3, '???');

    snapshotEngine.changeStore.addChange({
      documentId: 'test-doc',
      change: insertTextChange1
    }, function(err) {
      console.log('ERR', err);
      snapshotEngine.changeStore.addChange({
        documentId: 'test-doc',
        change: insertTextChange2
      }, cb);
    });
  }

  QUnit.test('Compute a new snapshot', function(assert) {
    var done = assert.async();
    snapshotEngine.getSnapshot({documentId: 'test-doc'}, function(err, snapshot) {
      console.log(err);
      assert.notOk(err, 'There should be no error');
      assert.equal(snapshot.version, 1, 'Snapshot should be at version 1');
      done();
    });
  });

  QUnit.test('Compute a new snapshot for 3 changes', function(assert) {
    var done = assert.async();

    addChanges(function() {
      debugger;
      snapshotEngine.getSnapshot({documentId: 'test-doc'}, function(err, snapshot) {
        console.log(err);
        assert.notOk(err, 'There should be no error');
        assert.equal(snapshot.version, 3, 'Snapshot should be at version 3');
        done();
      });
    });

  });


  QUnit.test('Call with wrong arguments', function(assert) {
    var done = assert.async();
    snapshotEngine.getSnapshot('test-doc', function(err) {
      assert.equal(err.name, 'InvalidArgumentsError', 'Should have invalid args error');
      done();
    });
  });


}

module.exports = testSnapshotEngine;
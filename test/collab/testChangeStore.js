import { async } from 'substance'
import { test } from 'substance-test'

let EXAMPLE_CHANGE = {
  ops: [{some: 'operation'}],
  info: {
    userId: 'testuser'
  }
}

/*
  Util for seeding
*/
function _addChange (store, change) {
  return function (cb) {
    store.addChange('test-doc', change, cb)
  }
}

function testChangeStore (createEmptyChangeStore) {
  /*
    Add change
  */

  test('ChangeStore: Add a first change', (t) => {
    let changeStore = createEmptyChangeStore()
    changeStore.addChange('test-doc', EXAMPLE_CHANGE, (err, version) => {
      t.notOk(err, 'Should not error')
      t.equal(version, 1, 'Initial version should be one')
      t.end()
    })
  })

  test('ChangeStore: Add a second change', (t) => {
    let changeStore = createEmptyChangeStore()
    async.series([
      _addChange(changeStore, EXAMPLE_CHANGE)
    ], () => {
      changeStore.addChange('test-doc', EXAMPLE_CHANGE, (err, version) => {
        t.notOk(err, 'Should not error')
        t.equal(version, 2, 'Incremened version should be two')
        t.end()
      })
    })
  })

  /*
    Get changes
  */

  test('ChangeStore: Get all changes', (t) => {
    let changeStore = createEmptyChangeStore()
    async.series([
      _addChange(changeStore, EXAMPLE_CHANGE),
      _addChange(changeStore, EXAMPLE_CHANGE)
    ], () => {
      changeStore.getChanges('test-doc', (err, changes, version) => {
        if (err) t.fail()
        t.equal(changes.length, 2, 'There should be two changes in the db')
        t.equal(version, 2, 'Latest version should be 2')
        t.end()
      })
    })
  })

  test('ChangeStore: Get changes since version 1 (2 changes stored)', (t) => {
    let changeStore = createEmptyChangeStore()
    async.series([
      _addChange(changeStore, EXAMPLE_CHANGE),
      _addChange(changeStore, EXAMPLE_CHANGE)
    ], () => {
      changeStore.getChanges('test-doc', 1, (err, changes, version) => {
        if (err) t.fail()
        t.equal(changes.length, 1, 'There should be two changes since version 1')
        t.equal(version, 2, 'Doc version should be 2')
        t.end()
      })
    })
  })

  test('ChangeStore: Get changes since version 1 up to version 2 (3 changes stored)', (t) => {
    let changeStore = createEmptyChangeStore()
    async.series([
      _addChange(changeStore, EXAMPLE_CHANGE),
      _addChange(changeStore, EXAMPLE_CHANGE),
      _addChange(changeStore, EXAMPLE_CHANGE)
    ], () => {
      changeStore.getChanges('test-doc', 1, 2, (err, changes, version) => {
        if (err) t.fail()
        t.equal(changes.length, 1, 'There should be two changes since version 1')
        t.equal(version, 3, 'Latest version should be 3')
        t.end()
      })
    })
  })

  test('ChangeStore: Should return no changes if sinceVersion = actual version', (t) => {
    let changeStore = createEmptyChangeStore()
    async.series([
      _addChange(changeStore, EXAMPLE_CHANGE)
    ], () => {
      changeStore.getChanges('test-doc', 1, (err, changes, version) => {
        t.notOk(err, 'Should not error')
        t.equal(changes.length, 0, 'Should have zero changes')
        t.equal(version, 1, 'Document version should be 1')
        t.end()
      })
    })
  })

  /*
    Get version
  */

  test('ChangeStore: Return version of test-doc', function (t) {
    let changeStore = createEmptyChangeStore()
    async.series([
      _addChange(changeStore, EXAMPLE_CHANGE)
    ], () => {
      changeStore.getVersion('test-doc', (err, version) => {
        t.notOk(err, 'Should not error')
        t.equal(version, 1, 'Document version should equal 1')
        t.end()
      })
    })
  })

  test('ChangeStore: Return version=0 if no changes are found', (t) => {
    let changeStore = createEmptyChangeStore()
    changeStore.getVersion('not-existing-doc', (err, version) => {
      t.notOk(err, 'Should not error')
      t.equal(version, 0, 'Document version should equal 0')
      t.end()
    })
  })

  /*
    Delete changes
  */

  test('ChangeStore: Delete all changes', (t) => {
    let changeStore = createEmptyChangeStore()
    async.series([
      _addChange(changeStore, EXAMPLE_CHANGE),
      _addChange(changeStore, EXAMPLE_CHANGE)
    ], () => {
      changeStore.deleteChanges('test-doc', function (err, changeCount) {
        t.notOk(err, 'Should not error')
        t.equal(changeCount, 2, 'There should be 2 deleted change')
        changeStore.getChanges('test-doc', (err, changes, version) => {
          t.notOk(err, 'Should not error')
          t.equal(changes.length, 0, 'There should not be changes anymore')
          t.equal(version, 0, 'Document version should be 0')
          t.end()
        })
      })
    })
  })

  test('ChangeStore: Delete changes of not existing doc', (t) => {
    let changeStore = createEmptyChangeStore()
    changeStore.deleteChanges('not-existing-doc', (err, changeCount) => {
      t.notOk(err, 'Should not error')
      t.equal(changeCount, 0, 'There should be 0 deleted changes')
      t.end()
    })
  })
}

export default testChangeStore

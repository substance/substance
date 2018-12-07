/* eslint-disable consistent-return */
import { test } from 'substance-test'
import { DocumentEngine } from 'substance'
import makeStoresFixture from './makeStoresFixture'

/*
  TODO: Test documentEngine.deleteDocument, which removes clears all changes
        and snapshots
*/

test('DocumentEngine: Should allow creation of a new document', function (t) {
  let documentEngine = _fixture(0) // 0 changes, no snapshots
  let initialChange = _getChange(1)

  documentEngine.createDocument('test-doc', initialChange, function (err, newVersion) {
    t.notOk(err, 'Should not error')
    t.equal(newVersion, 1, 'Initial version should be 1')
    documentEngine.getDocument('test-doc', (err, snapshot, headVersion) => {
      if (err) t.fail()
      t.ok(snapshot, 'Should have a snaphot')
      t.equal(headVersion, 1, 'Head version should be 1')
      t.end()
    })
  })
})

test('DocumentEngine: Should allow adding a new change', function (t) {
  let documentEngine = _fixture(2) // 0 changes, no snapshots
  let newChange = _getChange(3)

  documentEngine.addChange('test-doc', newChange, function (err, newVersion) {
    t.notOk(err, 'Should not error')
    t.equal(newVersion, 3, 'New version should be 3')
    documentEngine.getDocument('test-doc', (err, snapshot, headVersion) => {
      if (err) t.fail()
      t.ok(snapshot, 'Should have a snaphot')
      t.equal(headVersion, 3, 'Latest snapshot version should be 3')
      t.end()
    })
  })
})

test('DocumentEngine: Should be able to retrieve changes', function (t) {
  let documentEngine = _fixture(2) // 0 changes, no snapshots
  documentEngine.getChanges('test-doc', (err, changes) => {
    if (err) t.fail()
    t.equal(changes.length, 2, 'Should have two changes')
    t.end()
  })
})

/*
  'test-doc' with numChanges changes and available snapshots

  @param {Number} numChanges number of available changes
  @param {Number[]} snapshots an array of version numbers
*/
function _fixture (numChanges, snapshots) {
  let stores = makeStoresFixture(numChanges, snapshots)
  let documentEngine = new DocumentEngine({
    changeStore: stores.changeStore,
    snapshotStore: stores.snapshotStore,
    snapshotFrequency: 1 // store snapshots for each version
  })
  return documentEngine
}

/*
  Compute a valid change
*/
function _getChange (changeNum) {
  let stores = makeStoresFixture(changeNum)
  return stores.changeStore._changes['test-doc'][changeNum - 1]
}

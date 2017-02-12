import computeSnapshot from '../../collab/computeSnapshot'
import SnapshotStore from '../../collab/SnapshotStore'
import ChangeStore from '../../collab/ChangeStore'
import createTestArticle from '../fixture/createTestArticle'
import createChangeset from '../fixture/createChangeset'
import twoParagraphs from '../fixture/twoParagraphs'

const EMPTY_DOC = {nodes: {}}

/*
  Some transforms for paragraph (p1)
*/
function insertText(pos, text) {
  return function(tx) {
    tx.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: pos })
    tx.insertText(text)
  }
}

/*
  'test-doc' with numChanges changes and available snapshots

  @param {Number} numChanges number of available changes
  @param {Number[]} snapshots an array of version numbers
*/
function makeStoresFixture(numChanges, snapshots) {
  // available snapshots e.g. [1,2,5]
  snapshots = snapshots || []

  let changeFns = []
  if (numChanges > 0) changeFns.push(twoParagraphs)
  for(var i=1; i < numChanges; i++) {
    changeFns.push(insertText(3, 'foo'))
  }
  let changes = createChangeset(createTestArticle(), changeFns)
  let changeStore = new ChangeStore({
    'test-doc': changes
  })
  let snapshotSeed = {'test-doc': {}}
  snapshots.forEach((version) => {
    snapshotSeed['test-doc'][version] = computeSnapshot(
      EMPTY_DOC,
      changes.slice(0,version)
    )
  })
  let snapshotStore = new SnapshotStore(snapshotSeed)
  return {
    changeStore: changeStore,
    snapshotStore: snapshotStore
  }
}

export default makeStoresFixture

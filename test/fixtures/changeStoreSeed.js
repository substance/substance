import TestArticle from '../model/TestArticle'
import createChangeset from './createChangeset'
import twoParagraphs from './twoParagraphs'

/*
  Some transforms for paragraph 1
*/
let insertText1 = (tx) => {
  tx.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 1 })
  tx.insertText('a')
}

let insertText2 = (tx) => {
  tx.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 3 })
  tx.insertText('???')
}

/*
  Generate seed changesets
*/
let changeset1 = createChangeset(new TestArticle(), twoParagraphs)
let changeset2 = createChangeset(new TestArticle(), (tx) => {
  twoParagraphs(tx)
  insertText1(tx)
  // insertText2(tx)
})

let changeset3 = createChangeset(new TestArticle(), [
  twoParagraphs,
  insertText1,
  insertText2
])

var changeStoreSeed = {
  'test-doc': changeset1,   // 1 change
  'test-doc-2': changeset2, // 1 change
  'test-doc-3': changeset3  // 3 changes
}

export default changeStoreSeed
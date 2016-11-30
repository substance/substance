import TestArticle from '../model/TestArticle'
import createChangeset from './createChangeset'
import twoParagraphs from './twoParagraphs'

var changeset1 = createChangeset(new TestArticle(), twoParagraphs)
var changeset2 = createChangeset(new TestArticle(), function(tx) {
  twoParagraphs(tx)
  tx.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 1 })
  tx.insertText('!')
  tx.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 3 })
  tx.insertText('???')
})

var changeStoreSeed = {
  'test-doc': changeset1,
  'test-doc-2': changeset2
}

export default changeStoreSeed
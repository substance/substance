import TestArticle from '../model/TestArticle'
import createChangeset from './createChangeset'
import twoParagraphs from './twoParagraphs'
import insertText from './insertText'

// var changeset1 = createChangeset(new TestArticle(), twoParagraphs)
// var changeset2 = createChangeset(new TestArticle(), function(tx) {
//   twoParagraphs(tx)
//   insertText(tx, {
//     path: ['p1', 'content'],
//     pos: 1,
//     text: '!'
//   })
//   insertText(tx, {
//     path: ['p1', 'content'],
//     pos: 3,
//     text: '???'
//   })
// })

var changeStoreSeed = {
  // 'test-doc': changeset1,
  // 'test-doc-2': changeset2
}

export default changeStoreSeed
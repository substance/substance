import { module } from 'substance-test'
import setupEditor from './fixture/setupEditor'
import simple from './fixture/simple'
import FindAndReplaceManager from '../packages/find-and-replace/FindAndReplaceManager'

/*

Priorities:

  [ ] implement search and replace functionality on model level
  [ ] add markers via markers manager

```
body:
  p1: '0123456789'
  p2: '0123456789'
  p3: '0123456789'
  p4: '0123456789'
```
*/

const test = module('FindAndReplaceManager')

test("Find matches for a given search query and select first match", function(t) {
  let { editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})

  manager.startFind('123')
  t.equal(manager._state.matches.length, 4, 'Should have 4 matches selected')
  t.equal(manager._state.selectedMatch, 0, 'First match should be selected')
  // TODO: editorSession.getSelection() should be at p1[1..4]
  t.end()
})

// TODO: Add test that selects first match after last cursor position
//       E.g. when cursor at end of p2 '123' of p3 should be selected

test("Select next match", function(t) {
  let { editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})

  manager.startFind('123')
  manager.findNext()

  t.equal(manager._state.matches.length, 4, 'Should have 4 matches selected')
  t.equal(manager._state.selectedMatch, 1, '2nd match should be selected')
  // TODO: editorSession.getSelection() should be at p2[1..4]
  t.end()
})

test("Select previous match", function(t) {
  let { editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})

  manager.startFind('123')
  manager.findPrevious()

  t.equal(manager._state.matches.length, 4, 'Should have 4 matches selected')
  t.equal(manager._state.selectedMatch, 3, '3rd match should be selected')
  // TODO: editorSession.getSelection() should be at p4[1..4]
  t.end()
})

test("Replace first match", function(t) {
  let { editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})

  manager.startFind('123', 'XXX')
  manager.replaceNext()

  t.equal(manager._state.matches.length, 3, 'Should have 3 matches selected')
  t.equal(manager._state.selectedMatch, 0, '1st match should be selected')
  // TODO: first paragraph should be '0XXX456789'
  // TODO: editorSession.getSelection() should be at p2[1..4]
  t.end()
})

test("Replace all matches", function(t) {
  let { editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})

  t.equal(manager._state.matches.length, 4, 'Should have 4 matches selected')
  manager.startFind('123', 'XXX')
  manager.replaceAll()

  t.equal(manager._state.matches.length, 0, 'There should be no matches remaining')
  t.equal(manager._state.selectedMatch, undefined, 'selectedMatch should be undefined')
  // TODO: editorSession.getSelection() should be at p2[1..4]
  // TODO: all paragraphs should be '0XXX456789'
  t.end()
})

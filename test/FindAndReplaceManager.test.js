import { module } from 'substance-test'
import { FindAndReplacePackage } from 'substance'
import setupEditor from './fixture/setupEditor'
import simple from './fixture/simple'

const { FindAndReplaceManager } = FindAndReplacePackage

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

test("Find matches and select first after current selection", function(t) {
  let { editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})
  editorSession.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 7, endOffset: 7 })
  manager.startFind('123')
  t.equal(manager._state.matches.length, 4, 'Should have 4 matches selected')
  t.equal(manager._state.selectedMatch, 0, 'Second match should be selected')
  let sel = editorSession.getSelection()
  t.ok(sel.isPropertySelection(), 'Should be property selection')
  t.deepEqual(sel.start.path, ['p1', 'content'], 'Cursor should be after inserted text')
  t.equal(sel.start.offset, 1, 'Start offset should be 1')
  t.equal(sel.end.offset, 4, 'End offset should be 4')
  t.end()
})

test("Select next match", function(t) {
  let { editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})

  manager.startFind('123')
  manager.findNext()

  t.equal(manager._state.matches.length, 4, 'Should have 4 matches selected')
  t.equal(manager._state.selectedMatch, 1, '2nd match should be selected')

  let sel = editorSession.getSelection()
  t.ok(sel.isPropertySelection(), 'Should be property selection')
  t.deepEqual(sel.start.path, ['p2', 'content'], 'Cursor should be after inserted text')
  t.equal(sel.start.offset, 1, 'Start offset should be 1')
  t.equal(sel.end.offset, 4, 'End offset should be 4')

  t.end()
})

test("Select previous match", function(t) {
  let { editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})
  manager.startFind('123')
  manager.findPrevious()
  t.equal(manager._state.matches.length, 4, 'Should have 4 matches selected')
  t.equal(manager._state.selectedMatch, 3, '3rd match should be selected')
  let sel = editorSession.getSelection()
  t.ok(sel.isPropertySelection(), 'Should be property selection')
  t.deepEqual(sel.start.path, ['p4', 'content'], 'Cursor should be after inserted text')
  t.equal(sel.start.offset, 1, 'Start offset should be 1')
  t.equal(sel.end.offset, 4, 'End offset should be 4')
  t.end()
})

test("Replace first match", function(t) {
  let { editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})
  manager.startFind('123', 'XXX')
  manager.replaceNext()
  t.equal(manager._state.matches.length, 3, 'Should have 3 matches selected')
  t.equal(manager._state.selectedMatch, 0, '1st match should be selected')
  // TODO: Test if first paragraph is '0XXX456789'
  let sel = editorSession.getSelection()
  t.ok(sel.isPropertySelection(), 'Should be property selection')
  t.deepEqual(sel.start.path, ['p2', 'content'], 'Cursor should be after inserted text')
  t.equal(sel.start.offset, 1, 'Start offset should be 1')
  t.equal(sel.end.offset, 4, 'End offset should be 4')
  t.end()
})

test("Replace all matches", function(t) {
  let { editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})
  manager.startFind('123', 'XXX')
  t.equal(manager._state.matches.length, 4, 'Should have 4 matches selected')
  manager.replaceAll()
  t.equal(manager._state.matches.length, 0, 'There should be no matches remaining')
  t.equal(manager._state.selectedMatch, undefined, 'selectedMatch should be undefined')
  // TODO: Test if all paragraphs are '0XXX456789'
  t.end()
})

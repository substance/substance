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
  t.equal(manager._getMatchesLength(), 4, 'Should have 4 matches selected')
  t.equal(manager._getSelectedMatchIndex(), 1, 'Second match should be selected')
  let sel = editorSession.getSelection()
  t.ok(sel.isPropertySelection(), 'Should be property selection')
  t.deepEqual(sel.start.path, ['p2', 'content'], 'Cursor should be after inserted text')
  t.equal(sel.start.offset, 1, 'Start offset should be 1')
  t.equal(sel.end.offset, 4, 'End offset should be 4')
  t.end()
})

test("Select next match", function(t) {
  let { editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})

  manager.startFind('123')
  manager.findNext()

  t.equal(manager._getMatchesLength(), 4, 'Should have 4 matches selected')
  t.equal(manager._getSelectedMatchIndex(), 1, '2nd match should be selected')

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
  t.equal(manager._getMatchesLength(), 4, 'Should have 4 matches selected')
  t.equal(manager._getSelectedMatchIndex(), 3, '3rd match should be selected')
  let sel = editorSession.getSelection()
  t.ok(sel.isPropertySelection(), 'Should be property selection')
  t.deepEqual(sel.start.path, ['p4', 'content'], 'Cursor should be after inserted text')
  t.equal(sel.start.offset, 1, 'Start offset should be 1')
  t.equal(sel.end.offset, 4, 'End offset should be 4')
  t.end()
})

test("Replace first match", function(t) {
  let { doc, editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})
  editorSession.setSelection({ type: 'property', path: ['p1', 'content'], startOffset: 1, endOffset: 1 })
  manager.startFind('123')
  manager.setReplaceString('XXX')
  manager.replaceNext()
  t.equal(manager._getMatchesLength(), 3, 'Should have 3 matches selected')
  t.equal(manager._getSelectedMatchIndex(), 0, '1st match should be selected')
  let sel = editorSession.getSelection()
  let content = doc.get(['p1', 'content'])
  t.ok(sel.isPropertySelection(), 'Should be property selection')
  t.deepEqual(sel.start.path, ['p2', 'content'], 'Cursor should be after inserted text')
  t.equal(sel.start.offset, 1, 'Start offset should be 1')
  t.equal(sel.end.offset, 4, 'End offset should be 4')
  t.equal(content, '0XXX456789', 'Content should be 0XXX456789')
  t.end()
})

test("Replace second match", function(t) {
  let { doc, editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})
  manager.startFind('123')
  manager.setReplaceString('XXX')
  manager.findNext()
  manager.replaceNext()
  t.equal(manager._getMatchesLength(), 3, 'Should have 3 matches selected')
  t.equal(manager._getSelectedMatchIndex(), 1, '2nd match should be selected')
  let sel = editorSession.getSelection()
  let content = doc.get(['p2', 'content'])
  t.ok(sel.isPropertySelection(), 'Should be property selection')
  t.deepEqual(sel.start.path, ['p3', 'content'], 'Cursor should be after inserted text')
  t.equal(sel.start.offset, 1, 'Start offset should be 1')
  t.equal(sel.end.offset, 4, 'End offset should be 4')
  t.equal(content, '0XXX456789', 'Content should be 0XXX456789')
  t.end()
})

test("Replace match with longer string", function(t) {
  let { editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})
  manager.startFind('123')
  manager.setReplaceString('XXXX')
  manager.replaceNext()
  t.equal(manager._getMatchesLength(), 3, 'Should have 3 matches selected')
  t.equal(manager._getSelectedMatchIndex(), 0, '1st match should be selected')
  let sel = editorSession.getSelection()
  t.ok(sel.isPropertySelection(), 'Should be property selection')
  t.deepEqual(sel.start.path, ['p2', 'content'], 'Cursor should be after inserted text')
  t.equal(sel.start.offset, 1, 'Start offset should be 1')
  t.equal(sel.end.offset, 4, 'End offset should be 4')
  t.end()
})

test("Replace all one by one from third match", function(t) {
  let { doc, editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})
  editorSession.setSelection({ type: 'property', path: ['p3', 'content'], startOffset: 1, endOffset: 1 })
  manager.startFind('123')
  manager.setReplaceString('XXX')
  manager.replaceNext()
  t.equal(manager._getMatchesLength(), 3, 'Should have 3 matches selected')
  t.equal(manager._getSelectedMatchIndex(), 2, '3d match should be selected')
  let sel = editorSession.getSelection()
  let content = doc.get(['p3', 'content'])
  t.ok(sel.isPropertySelection(), 'Should be property selection')
  t.deepEqual(sel.start.path, ['p4', 'content'], 'Cursor should be after inserted text')
  t.equal(sel.start.offset, 1, 'Start offset should be 1')
  t.equal(sel.end.offset, 4, 'End offset should be 4')
  t.equal(content, '0XXX456789', 'Content should be 0XXX456789')
  manager.replaceNext()
  t.equal(manager._getMatchesLength(), 2, 'Should have 2 matches selected')
  t.equal(manager._getSelectedMatchIndex(), 0, '1st match should be selected')
  sel = editorSession.getSelection()
  content = doc.get(['p4', 'content'])
  t.ok(sel.isPropertySelection(), 'Should be property selection')
  t.deepEqual(sel.start.path, ['p1', 'content'], 'Cursor should be after inserted text')
  t.equal(sel.start.offset, 1, 'Start offset should be 1')
  t.equal(sel.end.offset, 4, 'End offset should be 4')
  t.equal(content, '0XXX456789', 'Content should be 0XXX456789')
  t.end()
})

test("Replace all matches", function(t) {
  let { doc, editorSession } = setupEditor(t, simple)
  let manager = new FindAndReplaceManager({editorSession})
  manager.startFind('123')
  manager.setReplaceString('XXX')
  t.equal(manager._getMatchesLength(), 4, 'Should have 4 matches selected')
  manager.replaceAll()
  t.equal(manager._getMatchesLength(), 0, 'There should be no matches remaining')
  t.equal(manager._getSelectedMatchIndex(), undefined, 'selectedMatch should be undefined')
  let nodes = doc.getNodes()
  for(let nodeId in nodes){
    if(nodes[nodeId].isText()) {
      let content = doc.get([nodeId, 'content'])
      t.equal(content, '0XXX456789', nodeId + ' content should be 0XXX456789')
    }
  }
  // TODO: Test if all paragraphs are '0XXX456789'
  t.end()
})

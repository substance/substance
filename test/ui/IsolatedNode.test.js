import { module } from 'substance-test'
import setup from './setupContainerEditor'
import nestedContainers from '../fixtures/nestedContainers'

const test = module('ui/IsolatedNode')

test("IsolatedNodes should be 'not-selected' when selection is null", function(t) {
  var env = setup(nestedContainers)
  var editorSession = env.editorSession
  var isolatedNodes = env.app.findAll('.sc-isolated-node')
  editorSession.setSelection(null)
  isolatedNodes.forEach(function(isolated){
    t.ok(isolated.isNotSelected(), "isolated node '"+isolated.getId()+"' should not be selected.")
  })
  t.end()
})

test("IsolatedNodes should be 'not-selected' when selection is somewhere else", function(t) {
  var env = setup(nestedContainers)
  var editorSession = env.editorSession
  var doc = editorSession.getDocument()
  var isolatedNodes = env.app.findAll('.sc-isolated-node')
  editorSession.setSelection(doc.createSelection(['p1', 'content'], 0))
  isolatedNodes.forEach(function(isolated){
    t.ok(isolated.isNotSelected(), "isolated node '"+isolated.getId()+"' should not be selected.")
  })
  t.end()
})

test("IsolatedNode should be 'selected' with node selection", function(t) {
  var env = setup(nestedContainers)
  var doc = env.doc
  var bodyEditor = env.app.find('.sc-container-editor[data-id="body"]')
  var isolatedNodes = env.app.findAll('.sc-isolated-node')
  bodyEditor.setSelection(doc.createSelection({
    type: 'node', containerId: 'body', nodeId: 'c1', mode: 'full'
  }))
  var expected = {
    'body/c1': 'selected',
    'body/c1/c1/c2': undefined,
  }
  isolatedNodes.forEach(function(isolated){
    var id = isolated.getId()
    t.equal(isolated.getMode(), expected[id], "mode of isolated node '" + id + "' should be correct")
  })
  t.end()
})

test("IsolatedNode should be 'co-selected' with spanning container selection", function(t) {
  var env = setup(nestedContainers)
  var doc = env.doc
  var bodyEditor = env.app.find('.sc-container-editor[data-id="body"]')
  var isolatedNodes = env.app.findAll('.sc-isolated-node')
  bodyEditor.setSelection(doc.createSelection({
    type: 'container', containerId: 'body',
    startPath: ['p1', 'content'], startOffset: 1,
    endPath: ['p2', 'content'], endOffset: 2
  }))
  var expected = {
    'body/c1': 'co-selected',
    // Note: 'co-selection' does not propagate down
    // it is a state related to the parent container
    'body/c1/c1/c2/c2': undefined,
  }
  isolatedNodes.forEach(function(isolated){
    var id = isolated.getId()
    t.equal(isolated.getMode(), expected[id], "mode of isolated node '" + id + "' should be correct")
  })
  t.end()
})

test("IsolatedNode should be 'focused' when having the selection", function(t) {
  var env = setup(nestedContainers)
  var doc = env.doc
  var editorSession = env.editorSession
  var isolatedNodes = env.app.findAll('.sc-isolated-node')
  editorSession.setSelection(doc.createSelection({
    type: 'property',
    path: ['c1_p1', 'content'],
    startOffset: 0,
    surfaceId: 'body/c1/c1'
  }))
  var expected = {
    'body/c1': 'focused',
    'body/c1/c1/c2': undefined,
  }
  isolatedNodes.forEach(function(isolated){
    var id = isolated.getId()
    t.equal(isolated.getMode(), expected[id], "mode of isolated node '" + id + "' should be correct")
  })
  t.end()
})

test("IsolatedNode should be 'co-focused' when child is having the selection", function(t) {
  var env = setup(nestedContainers)
  var doc = env.doc
  var editorSession = env.editorSession
  var isolatedNodes = env.app.findAll('.sc-isolated-node')
  editorSession.setSelection(doc.createSelection({
    type: 'property',
    path: ['c2_p1', 'content'],
    startOffset: 0,
    surfaceId: 'body/c1/c1/c2/c2'
  }))
  var expected = {
    'body/c1': 'co-focused',
    'body/c1/c1/c2': 'focused',
  }
  isolatedNodes.forEach(function(isolated){
    var id = isolated.getId()
    t.equal(isolated.getMode(), expected[id], "mode of isolated node '" + id + "' should be correct")
  })
  t.end()
})

function _twoStructuredNodes(doc) {
  var body = doc.get('body')
  body.show(doc.create({
    type: 'structured-node',
    id: 'sn',
    title: 'Foo'
  }))
  body.show(doc.create({
    type: 'structured-node',
    id: 'sn2',
    title: 'Bar'
  }))
}

// revealed issue #696
test("IsolatedNode should be robust 'co-focused' w.r.t. prefix of surface id", function(t) {
  // as experienced in #696 it happened that co-focused state was infered just
  // by using startsWith on the surface path. This was leading to wrong
  // co-focused states when e.g. two isolated nodes `body/entity` and `body/entity-1`
  // exist. I.e. one surfaceId was a prefix of another one.
  var env = setup(_twoStructuredNodes)
  var doc = env.doc
  var editorSession = env.editorSession
  var isolatedNodes = env.app.findAll('.sc-isolated-node')
  editorSession.setSelection(doc.createSelection({
    type: 'property',
    path: ['c2_p1', 'content'],
    startOffset: 0,
    surfaceId: 'body/sn2/sn2.title'
  }))
  var expected = {
    'body/sn': undefined,
    'body/sn2': 'focused',
  }
  isolatedNodes.forEach(function(isolated){
    var id = isolated.getId()
    t.equal(isolated.getMode(), expected[id], "mode of isolated node '" + id + "' should be correct")
  })
  t.end()
})

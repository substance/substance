import { test } from 'substance-test'
import setupEditor from './shared/setupEditor'
import nestedContainers from './fixture/nestedContainers'

test("IsolatedNode: IsolatedNodes should be 'not-selected' when selection is null", t => {
  const { editorSession, editor } = setupEditor(t, nestedContainers)
  const isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection(null)
  isolatedNodes.forEach(n => _notSelected(t, n))
  t.end()
})

test("IsolatedNode: IsolatedNodes should be 'not-selected' when selection is somewhere else", t => {
  const { editorSession, editor } = setupEditor(t, nestedContainers)
  const isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection({
    type: 'property',
    path: ['p1', 'content'],
    startOffset: 0,
    surfaceId: 'body'
  })
  isolatedNodes.forEach(function (isolated) {
    t.ok(isolated.isNotSelected(), "isolated node '" + isolated.getId() + "' should not be selected.")
  })
  t.end()
})

test("IsolatedNode: IsolatedNode should be 'selected' with node selection", t => {
  const { editorSession, editor } = setupEditor(t, nestedContainers)
  const isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection({
    type: 'node',
    nodeId: 'c1',
    containerPath: ['body', 'nodes'],
    surfaceId: 'body'
  })
  const expected = {
    'body/c1': 'selected',
    // TODO: we need to find a more intuitive way to surfaceIds
    'body/c1/c1/c2': undefined
  }
  isolatedNodes.forEach(n => _modeOk(t, n, expected))
  t.end()
})

test("IsolatedNode: IsolatedNode should be 'co-selected' with spanning container selection", t => {
  const { editorSession, editor } = setupEditor(t, nestedContainers)
  const isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection({
    type: 'container',
    containerPath: ['body', 'nodes'],
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p2', 'content'],
    endOffset: 2,
    surfaceId: 'body'
  })
  const expected = {
    'body/c1': 'co-selected',
    // Note: 'co-selection' does not propagate down
    // it is a state related to the parent container
    'body/c1/c1/c2': undefined
  }
  isolatedNodes.forEach(n => _modeOk(t, n, expected))
  t.end()
})

test("IsolatedNode: IsolatedNode should be 'focused' when having the selection", t => {
  const { editorSession, editor } = setupEditor(t, nestedContainers)
  const isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection({
    type: 'property',
    path: ['c1_p1', 'content'],
    startOffset: 0,
    // TODO: we need to find a more intuitive way to surfaceIds
    surfaceId: 'body/c1/c1'
  })
  const expected = {
    'body/c1': 'focused',
    // TODO: we need to find a more intuitive way to surfaceIds
    'body/c1/c1/c2': undefined
  }
  isolatedNodes.forEach(n => _modeOk(t, n, expected))
  t.end()
})

test("IsolatedNode: IsolatedNode should be 'co-focused' when child is having the selection", t => {
  const { editorSession, editor } = setupEditor(t, nestedContainers)
  const isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection({
    type: 'property',
    path: ['c2_p1', 'content'],
    startOffset: 0,
    // TODO: we need to find a more intuitive way to surfaceIds
    surfaceId: 'body/c1/c1/c2/c2'
  })
  const expected = {
    'body/c1': 'co-focused',
    // TODO: we need to find a more intuitive way to surfaceIds
    'body/c1/c1/c2': 'focused'
  }
  isolatedNodes.forEach(n => _modeOk(t, n, expected))
  t.end()
})

test("IsolatedNode: Issue #696: IsolatedNode should detect 'co-focused' robustly in presence of surface ids with same prefix", t => {
  // as experienced in #696 it happened that co-focused state was infered just
  // by using startsWith on the surface path. This was leading to wrong
  // co-focused states when e.g. two isolated nodes `body/entity` and `body/entity-1`
  // exist. I.e. one surfaceId was a prefix of another one.
  const { editorSession, editor } = setupEditor(t, TWO_STRUCTURED_NODES)
  const isolatedNodes = editor.findAll('.sc-isolated-node')
  editorSession.setSelection({
    type: 'property',
    path: ['sn2', 'title'],
    startOffset: 0,
    surfaceId: 'body/sn2/sn2.title'
  })
  const expected = {
    'body/sn': null,
    'body/sn2': 'focused'
  }
  isolatedNodes.forEach(n => _modeOk(t, n, expected))
  t.end()
})

test('IsolatedNode: Click on an IsolatedNode should select the node', t => {
  const { editor, editorSession } = setupEditor(t, TWO_STRUCTURED_NODES)
  const isolatedNode = editor.find('.sc-isolated-node[data-id="sn"]')
  // make sure there is no selection in the beginning
  editorSession.setSelection(null)
  // click on the isolatedNode
  _clickOnIsolatedNode(isolatedNode)
  const sel = editorSession.getSelection()
  t.deepEqual({
    type: sel.type,
    nodeId: sel.nodeId
  }, {
    type: 'node',
    nodeId: 'sn'
  }, 'node should be selected')
  t.end()
})

function _notSelected (t, isolated) {
  t.ok(isolated.isNotSelected(), "isolated node '" + isolated.getId() + "' should not be selected.")
}

function _modeOk (t, isolated, expected) {
  const id = isolated.getId()
  t.looseEqual(isolated.getMode(), expected[id], "mode of isolated node '" + id + "' should be correct")
}

function _clickOnIsolatedNode (comp) {
  // TODO: it might be better to have the click handler on the IsolatedNodeComponent instead of the blocker
  // e.g. also works when used without blocker
  comp.refs.blocker.el.click()
}

function TWO_STRUCTURED_NODES (doc) {
  const body = doc.get('body')
  body.append(doc.create({
    type: 'structured-node',
    id: 'sn',
    title: 'Foo'
  }))
  body.append(doc.create({
    type: 'structured-node',
    id: 'sn2',
    title: 'Bar'
  }))
}

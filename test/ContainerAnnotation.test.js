import { module } from 'substance-test'

import { AnnotationCommand } from 'substance'
import setupEditor from './fixture/setupEditor'
import { _p1, _p2, _p3, _p4 } from './fixture/samples'
import TestContainerAnnotation from './fixture/TestContainerAnnotation'

const test = module('ContainerAnnotation')

// ContainerAnnotationIndex

// should index when creating new ContainerAnnotations
// - anno by type
// - anchors by path

test("Indexing ContainerAnnotations and anchors when created", (t) => {
  const { doc } = setupEditor(t, _p1, _p2, _p3)
  doc.create({
    type: TestContainerAnnotation.type,
    id: 'anno',
    start: {
      path: ['p1', 'content'],
      offset: 3
    },
    end: {
      path: ['p3', 'content'],
      offset: 5
    },
    containerId: 'body'
  })
  const index = doc.getIndex('container-annotations')
  const annos = index.get('body')
  t.equal(annos.length, 1, 'There should be one annotation in the index.')
  t.equal(index.getAnchorsForPath(['p1', 'content']).length, 1, 'There should be one anchor on p1')
  t.equal(index.getAnchorsForPath(['p2', 'content']).length, 0, '.. no anchor on p2')
  t.equal(index.getAnchorsForPath(['p3', 'content']).length, 1, '.. and one anchor on p3')
  t.end()
})

test("Removing ContainerAnnotations and anchors when deleted", (t) => {
  const { doc } = setupEditor(t, _p1, _p2, _p3)
  doc.create({
    type: TestContainerAnnotation.type,
    id: 'anno',
    start: {
      path: ['p1', 'content'],
      offset: 3
    },
    end: {
      path: ['p3', 'content'],
      offset: 5
    },
    containerId: 'body'
  })
  doc.delete('anno')
  const index = doc.getIndex('container-annotations')
  const annos = index.get('body')
  t.equal(annos.length, 0, 'There should be no annotations in the index.')
  t.equal(index.getAnchorsForPath(['p1', 'content']).length, 0, 'There should be no anchor on p1')
  t.equal(index.getAnchorsForPath(['p2', 'content']).length, 0, '.. no anchor on p2')
  t.equal(index.getAnchorsForPath(['p3', 'content']).length, 0, '.. and no anchor on p3')
  t.end()
})

test("Updating index when path of anchors change", (t) => {
  const { doc } = setupEditor(t, _p1, _p2, _p3)
  doc.create({
    type: TestContainerAnnotation.type,
    id: 'anno',
    start: {
      path: ['p1', 'content'],
      offset: 3
    },
    end: {
      path: ['p3', 'content'],
      offset: 5
    },
    containerId: 'body'
  })
  doc.set(['anno', 'start', 'path'], ['p2', 'content'])
  const index = doc.getIndex('container-annotations')
  t.equal(index.getAnchorsForPath(['p1', 'content']).length, 0, 'There should be no anchor on p1')
  t.equal(index.getAnchorsForPath(['p2', 'content']).length, 1, '.. one anchor on p2')
  t.equal(index.getAnchorsForPath(['p3', 'content']).length, 1, '.. and one anchor on p3')
  t.end()
})

// same as before but changing the end coordinate instead
test("Updating index when path of anchors change (II)", (t) => {
  const { doc } = setupEditor(t, _p1, _p2, _p3)
  doc.create({
    type: TestContainerAnnotation.type,
    id: 'anno',
    start: {
      path: ['p1', 'content'],
      offset: 3
    },
    end: {
      path: ['p3', 'content'],
      offset: 5
    },
    containerId: 'body'
  })
  doc.set(['anno', 'end', 'path'], ['p2', 'content'])
  const index = doc.getIndex('container-annotations')
  t.equal(index.getAnchorsForPath(['p1', 'content']).length, 1, 'There should be one anchor on p1')
  t.equal(index.getAnchorsForPath(['p2', 'content']).length, 1, '.. one anchor on p2')
  t.equal(index.getAnchorsForPath(['p3', 'content']).length, 0, '.. and no anchor on p3')
  t.end()
})

// MarkersIndex

test("Adding markers when creating ContainerAnnotations", (t) => {
  const { editorSession } = setupEditor(t, _p1, _p2, _p3)
  editorSession.transaction(tx => {
    tx.create({
      type: TestContainerAnnotation.type,
      id: 'anno',
      start: {
        path: ['p1', 'content'],
        offset: 3
      },
      end: {
        path: ['p3', 'content'],
        offset: 5
      },
      containerId: 'body'
    })
  })
  const containerAnnotationManager = editorSession.getManager('container-annotation')
  const annoFragments = containerAnnotationManager.getAnnotationFragments('anno')
  t.equal(annoFragments.length, 3, 'There should be three markers for created annotation' )
  t.deepEqual(annoFragments[0].getPath(), ["p1", "content"], 'There should be one marker on p1')
  t.deepEqual(annoFragments[1].getPath(), ["p2", "content"], '.. one marker on p2')
  t.deepEqual(annoFragments[2].getPath(), ["p3", "content"], '.. and one marker on p3')
  t.end()
})

test("Updating markers when changing path of ContainerAnnotations", (t) => {
  const { editorSession } = setupEditor(t, _p1, _p2, _p3)
  editorSession.transaction(tx => {
    tx.create({
      type: TestContainerAnnotation.type,
      id: 'anno',
      start: {
        path: ['p1', 'content'],
        offset: 3
      },
      end: {
        path: ['p3', 'content'],
        offset: 5
      },
      containerId: 'body'
    })
    tx.set(['anno', 'start', 'path'], ['p2', 'content'])
  })
  const containerAnnotationManager = editorSession.getManager('container-annotation')
  const annoFragments = containerAnnotationManager.getAnnotationFragments('anno')
  t.equal(annoFragments.length, 2, 'There should be three markers for created annotation' )
  t.deepEqual(annoFragments[0].getPath(), ["p2", "content"], 'There should be one marker on p2')
  t.deepEqual(annoFragments[1].getPath(), ["p3", "content"], '.. and one marker on p3')
  t.end()
})

test("Toggle ContainerAnnotation tool must remove annotation", (t) => {
  const { doc, editorSession } = setupEditor(t, _p1, _p2, _p3)
  doc.create({
    type: TestContainerAnnotation.type,
    id: 'anno',
    start: {
      path: ['p1', 'content'],
      offset: 3
    },
    end: {
      path: ['p3', 'content'],
      offset: 5
    },
    containerId: 'body'
  })

  let cmd = new ToggleContainerAnnoCommand()
  editorSession.setSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 1
  })
  cmd.execute({
    commandState: {
      mode: 'delete'
    },
    editorSession: editorSession,
    selectionState: editorSession.getSelectionState()
  })

  const index = doc.getIndex('container-annotations')
  t.equal(index.getAnchorsForPath(['p2', 'content']).length, 0, 'There should be no container annotations left in index') 
  t.isNil(doc.get('anno'), 'Container annotation shouldn\'t exists')
  t.end()
})

test("Deleting selection with ContainerAnnotation inside should remove it", (t) => {
  const { doc, editorSession } = setupEditor(t, _p1, _p2, _p3)
  doc.create({
    type: TestContainerAnnotation.type,
    id: 'anno',
    start: {
      path: ['p1', 'content'],
      offset: 3
    },
    end: {
      path: ['p3', 'content'],
      offset: 5
    },
    containerId: 'body'
  })

  editorSession.setSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 1,
    endPath: ['p3', 'content'],
    endOffset: 5
  })

  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })

  const index = doc.getIndex('container-annotations')
  t.equal(index.getAnchorsForPath(['p2', 'content']).length, 0, 'There should be no container annotations left in index') 
  t.isNil(doc.get('anno'), 'Container annotation shouldn\'t exists')
  t.end()
})

test("Deleting node with ContainerAnnotation inside should remove it", (t) => {
  const { doc, editorSession } = setupEditor(t, _p1, _p2, _p3)
  doc.create({
    type: TestContainerAnnotation.type,
    id: 'anno',
    start: {
      path: ['p2', 'content'],
      offset: 3
    },
    end: {
      path: ['p2', 'content'],
      offset: 5
    },
    containerId: 'body'
  })

  editorSession.setSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 0,
    endPath: ['p2', 'content'],
    endOffset: doc.get('p2').getLength()
  })

  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })

  const index = doc.getIndex('container-annotations')
  t.equal(index.getAnchorsForPath(['p2', 'content']).length, 0, 'There should be no container annotations left in index') 
  t.isNil(doc.get('anno'), 'Container annotation shouldn\'t exists')
  t.end()
})

test("Deleting node where ContainerAnnotation begins should cut it", (t) => {
  const { doc, editorSession } = setupEditor(t, _p1, _p2, _p3)
  doc.create({
    type: TestContainerAnnotation.type,
    id: 'anno',
    start: {
      path: ['p1', 'content'],
      offset: 3
    },
    end: {
      path: ['p3', 'content'],
      offset: 5
    },
    containerId: 'body'
  })

  editorSession.setSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 0,
    endPath: ['p2', 'content'],
    endOffset: 0
  })

  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })

  const index = doc.getIndex('container-annotations')
  t.equal(index.getAnchorsForPath(['p1', 'content']).length, 0, 'There should be no container annotations left in index for p1') 
  t.equal(index.getAnchorsForPath(['p2', 'content']).length, 1, 'There should be one container annotations left in index for p2')
  t.equal(index.getAnchorsForPath(['p3', 'content']).length, 1, 'There should be one container annotations left in index for p3')
  t.end()
})

test("Merging paragraph with ContainerAnnotation into paragraph before should move it to new start", (t) => {
  const { doc, editorSession } = setupEditor(t, _p1, _p2, _p3)
  doc.create({
    type: TestContainerAnnotation.type,
    id: 'anno',
    start: {
      path: ['p2', 'content'],
      offset: 6
    },
    end: {
      path: ['p3', 'content'],
      offset: 5
    },
    containerId: 'body'
  })

  editorSession.setSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p2', 'content'],
    endOffset: 3
  })

  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })

  const index = doc.getIndex('container-annotations')
  t.equal(index.getAnchorsForPath(['p1', 'content']).length, 1, 'There should be one container annotation in index for p1')
  t.equal(index.getAnchorsForPath(['p2', 'content']).length, 0, 'There should be no container annotation in index for p2')
  t.end()
})

test("Merging: last selected paragraph contains end of container anno", (t) => {
  const { doc, editorSession } = setupEditor(t, _p1, _p2, _p3, _p4)
  doc.create({
    type: TestContainerAnnotation.type,
    id: 'anno',
    start: {
      path: ['p2', 'content'],
      offset: 6
    },
    end: {
      path: ['p3', 'content'],
      offset: 2
    },
    containerId: 'body'
  })

  editorSession.setSelection({
    type: 'container',
    containerId: 'body',
    startPath: ['p1', 'content'],
    startOffset: 4,
    endPath: ['p3', 'content'],
    endOffset: 4
  })

  editorSession.transaction((tx) => {
    tx.deleteSelection()
  })

  t.isNil(doc.get('anno'), 'Container annotation shouldn\'t exists')
  t.end()
})

class ToggleContainerAnnoCommand extends AnnotationCommand {
  constructor() {
    super({ name: 'test-container-anno', nodeType: 'test-container-anno' })
  }
}
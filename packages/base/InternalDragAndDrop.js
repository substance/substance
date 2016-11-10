import DragAndDropHandler from '../../ui/DragAndDropHandler'
import copySelection from '../../model/transform/copySelection'
import deleteSelection from '../../model/transform/deleteSelection'
import paste from '../../model/transform/paste'

class InternalDragAndDrop extends DragAndDropHandler {
  match(dragState) {
    console.log('dragState.sourceSelection', dragState.sourceSelection)
    return Boolean(dragState.sourceSelection)
  }

  drop(dragState, context) {
    debugger
    let containerId, nodeId, insertMode, surfaceId
    if (dragState.isContainerDrop) {
      containerId = dragState.surface.getContainerId()
      nodeId = dragState.targetNodeId
      insertMode = dragState.insertMode
      surfaceId = dragState.surface.id
    } else {
      console.error('Not yet supported')
      return
    }

    context.editorSession.transaction((tx) => {
      let copyResult = copySelection(tx, {selection: dragState.sourceSelection})
      deleteSelection(tx, {selection: dragState.sourceSelection})
      let insertSel
      if(dragState.isContainerDrop) {
        insertSel = tx.createSelection({
          type: 'node',
          containerId: containerId,
          nodeId: nodeId,
          mode: insertMode,
          surfaceId: surfaceId
        })
      }
      return paste(tx, {
        selection: insertSel,
        doc: copyResult.doc,
        containerId: containerId
      })
    })
  }

}

export default InternalDragAndDrop

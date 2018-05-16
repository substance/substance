import DragAndDropHandler from '../../ui/DragAndDropHandler'

export default
class MoveNode extends DragAndDropHandler {
  match (dragState) {
    let {type, insertPos} = dragState.dropParams
    return type === 'move' && insertPos >= 0
  }

  /*
    Implements drag+drop move operation.

    - remember current selection (node that is dragged)
    - delete current selection (removes node from original position)
    - determine node selection based on given insertPos
    - paste node at new insert position
  */
  drop (tx, dragState) {
    let { insertPos } = dragState.dropParams
    tx.setSelection(dragState.sourceSelection)
    let copy = tx.copySelection()
    // just clear, but don't merge or don't insert a new node
    tx.deleteSelection({ clear: true })

    let containerId = dragState.sourceSelection.containerId
    let surfaceId = dragState.sourceSelection.surfaceId
    let container = tx.get(containerId)

    let targetNodeId = container.getNodeIdAt(insertPos)
    let insertMode = 'before'
    if (!targetNodeId) {
      targetNodeId = container.getNodeIdAt(insertPos - 1)
      insertMode = 'after'
    }
    tx.setSelection({
      type: 'node',
      nodeId: targetNodeId,
      mode: insertMode,
      containerId: containerId,
      surfaceId: surfaceId
    })
    tx.paste(copy)
  }
}

import last from '../../util/last'
import Command from '../../ui/Command'

class SelectAll extends Command {
  getCommandState (params) {
    let editorSession = params.editorSession
    let isBlurred = editorSession.isBlurred()
    let surface = params.surface || editorSession.getFocusedSurface()
    let sel = editorSession.getSelection()
    // We only know what to do in ContainerEditors and TextPropertyEditors
    let disabled = (
      isBlurred ||
      !sel || sel.isNull() ||
      !surface ||
      !(surface._isContainerEditor || surface._isTextPropertyEditor)
    )
    return { disabled }
  }

  execute (params) {
    let editorSession = params.editorSession
    let doc = editorSession.getDocument()
    let surface = params.surface || editorSession.getFocusedSurface()
    if (surface) {
      let sel
      // TODO: what about CustomSurfaces?
      if (surface._isContainerEditor) {
        let container = surface.getContainer()
        let nodeIds = container.getContent()
        if (nodeIds.length === 0) return false
        let firstNodeId = nodeIds[0]
        let lastNodeId = last(nodeIds)
        sel = editorSession.createSelection({
          type: 'container',
          startPath: [firstNodeId],
          startOffset: 0,
          endPath: [lastNodeId],
          endOffset: 1,
          containerId: container.id,
          surfaceId: surface.id
        })
      } else if (surface._isTextPropertyEditor) {
        let path = surface.getPath()
        let text = doc.get(path)
        sel = editorSession.createSelection({
          type: 'property',
          path: path,
          startOffset: 0,
          endOffset: text.length,
          surfaceId: surface.id
        })
      }
      editorSession.setSelection(sel)
      return true
    }
    return false
  }
}

export default SelectAll

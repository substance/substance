import { last } from '../../util'
import { Command } from '../../ui'

class SelectAll extends Command {

  getCommandState(params) {
    let editorSession = params.editorSession
    let isBlurred = editorSession.isBlurred()
    return {
      disabled: editorSession.getSelection().isNull() || isBlurred
    }
  }

  execute(params) {
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

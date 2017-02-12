import Command from '../../ui/Command'
import last from '../../util/last'

class SelectAll extends Command {

  getCommandState(params) {
    let editorSession = params.editorSession
    return {
      disabled: editorSession.getSelection().isNull()
    }
  }

  execute(params) {
    let editorSession = params.editorSession
    let doc = editorSession.getDocument()
    let surface = params.surface || editorSession.getFocusedSurface()
    if (surface) {
      let sel
      // TODO: we should move the logic out of the surfaces
      if (surface._isContainerEditor) {
        let container = surface.getContainer()
        if (container.nodes.length === 0) {
          return false
        }
        let firstNodeId = container.nodes[0]
        let lastNodeId = last(container.nodes)
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

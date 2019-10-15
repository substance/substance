import { last } from '../util'
import Command from './Command'

/*
  Attention: in contrast to Substance.SelectAllCommand, this implementation does not take
  the surface type into consideration.
  The problem is, that for that, editorState.focusedSurface would need to be reduced
  in an earlier stage, which is impossible, as Surfaces are rendered during 'render'
  stage. So this is kind of an chicken-egg problem.
  In general, we should avoid making commandStates depend on rendered components.
*/
export default class SelectAllCommand extends Command {
  getCommandState (params) {
    let editorSession = params.editorSession
    let isBlurred = editorSession.isBlurred()
    let sel = editorSession.getSelection()
    let disabled = (
      isBlurred ||
      !sel || sel.isNull()
    )
    return { disabled }
  }

  execute (params, context) {
    let editorSession = context.editorSession
    let doc = editorSession.getDocument()
    let editorState = editorSession.getEditorState()
    let focusedSurface = editorState.focusedSurface
    if (focusedSurface) {
      let sel = null
      let surfaceId = focusedSurface.id
      if (focusedSurface._isContainerEditor) {
        let containerPath = focusedSurface.getContainerPath()
        let nodeIds = doc.get(containerPath)
        if (nodeIds.length === 0) return false
        let firstNodeId = nodeIds[0]
        let lastNodeId = last(nodeIds)
        sel = {
          type: 'container',
          startPath: [firstNodeId],
          startOffset: 0,
          endPath: [lastNodeId],
          endOffset: 1,
          containerPath,
          surfaceId
        }
      } else if (focusedSurface._isTextPropertyEditor) {
        let path = focusedSurface.getPath()
        let text = doc.get(path)
        sel = {
          type: 'property',
          path: path,
          startOffset: 0,
          endOffset: text.length,
          surfaceId
        }
      }
      if (sel) {
        editorSession.setSelection(sel)
      }
      return true
    }
    return false
  }
}

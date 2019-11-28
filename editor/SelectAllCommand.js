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
    const editorSession = params.editorSession
    const isBlurred = editorSession.isBlurred()
    const sel = editorSession.getSelection()
    const disabled = (
      isBlurred ||
      !sel || sel.isNull()
    )
    return { disabled }
  }

  execute (params, context) {
    const editorSession = context.editorSession
    const doc = editorSession.getDocument()
    const editorState = editorSession.getEditorState()
    const focusedSurface = editorState.focusedSurface
    if (focusedSurface) {
      let sel = null
      const surfaceId = focusedSurface.id
      if (focusedSurface._isContainerEditor) {
        const containerPath = focusedSurface.getContainerPath()
        const nodeIds = doc.get(containerPath)
        if (nodeIds.length === 0) return false
        const firstNodeId = nodeIds[0]
        const lastNodeId = last(nodeIds)
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
        const path = focusedSurface.getPath()
        const text = doc.get(path)
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

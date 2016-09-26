import Command from '../../ui/Command'
import insertInlineNode from '../../model/transform/insertInlineNode'

class InsertInlineNodeCommand extends Command {
  constructor(...args) {
    super(...args)

    if (!this.params.nodeType) {
      throw new Error('Every AnnotationCommand must have a nodeType')
    }
  }

  getCommandState(props, context) {
    let sel = context.documentSession.getSelection()
    let newState = {
      disabled: !sel.isPropertySelection(),
      active: false
    }
    return newState
  }

  execute(props, context) {
    let state = this.getCommandState(props, context)
    if (state.disabled) return
    let surface = context.surface || context.surfaceManager.getFocusedSurface()
    if (surface) {
      surface.transaction(function(tx, args) {
        return this.insertInlineNode(tx, args)
      }.bind(this))
    }
    return true
  }

  insertInlineNode(tx, args) {
    args.node = this.createNodeData(tx, args)
    return insertInlineNode(tx, args)
  }

  createNodeData(tx, args) { // eslint-disable-line
    return {
      type: this.params.nodeType
    }
  }

  _getAnnotationsForSelection(props) {
    return props.selectionState.getAnnotationsForType(this.params.nodeType)
  }

}

export default InsertInlineNodeCommand

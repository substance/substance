import Command from './Command'
import insertInlineNode from '../model/transform/insertInlineNode'

class InlineNodeCommand extends Command {
  constructor(...args) {
    super(...args)

    this.nodeType = this.params.nodeType

    if (!this.params.nodeType) {
      throw new Error("Every AnnotationCommand must have an 'nodeType'")
    }
  }

  /**
    Get the type of an annotation.

    @returns {String} The annotation's type.
   */
  getNodeType() {
    return this.nodeType
  }

  getCommandState(props, context) {
    let sel = context.documentSession.getSelection()
    let newState = {
      disabled: true,
      active: false,
      node: undefined
    }

    let annos = this._getAnnotationsForSelection(props, context)
    if (annos.length === 1 && annos[0].getSelection().equals(sel)) {
      newState.disabled = false;
      newState.active = true
      newState.node = annos[0]
    }

    return newState
  }

  _getAnnotationsForSelection(props) {
    return props.selectionState.getAnnotationsForType(this.getNodeType())
  }

  execute(props, context) {
    let state = this.getCommandState(props, context)
    if (state.disabled) return
    let surface = context.surface ||context.surfaceManager.getFocusedSurface()
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
      type: this.constructor.type
    }
  }

}

export default InlineNodeCommand

import Command from './Command'
import insertNode from '../model/transform/insertNode'

class InsertNodeCommand extends Command {

  getCommandState(props, context) {
    let sel = context.documentSession.getSelection();
    let newState = {
      disabled: true,
      active: false
    }
    if (sel && !sel.isNull() && sel.isPropertySelection()) {
      newState.disabled = false
    }
    return newState
  }

  execute(props, context) {
    var state = this.getCommandState(props, context)
    if (state.disabled) return
    var surface = context.surface ||context.surfaceManager.getFocusedSurface()
    if (surface) {
      surface.transaction(function(tx, args) {
        return this.insertNode(tx, args)
      }.bind(this))
    }
    return true
  }

  insertNode(tx, args) {
    args.node = this.createNodeData(tx, args)
    return insertNode(tx, args)
  }

  createNodeData(tx, args) { // eslint-disable-line
    throw new Error('InsertNodeCommand.createNodeData() is abstract.')
  }
}

export default InsertNodeCommand

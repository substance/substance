import Command from './Command'
import insertNode from '../model/transform/insertNode'

class InsertNodeCommand extends Command {

  getCommandState(params) {
    let sel = params.selection
    let newState = {
      disabled: true,
      active: false
    }
    if (sel && !sel.isNull() && sel.isPropertySelection()) {
      newState.disabled = false
    }
    return newState
  }

  execute(params) {
    var state = params.commandState
    if (state.disabled) return
    var surface = params.surface
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

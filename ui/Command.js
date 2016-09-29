import oo from '../util/oo'

/**
 Abstract interface for commands.

 @class
*/

class Command {
  constructor(params) {
    this.params = params || {}
    this.name = this.params.name
    if (!this.name) {
      throw new Error("'name' is required");
    }
  }

  get _isCommand() {
    return true
  }

  getName() {
    return this.name
  }

  getCommandState(props, context) { // eslint-disable-line
    throw new Error('Command.getCommandState() is abstract.')
  }

  /**
    Execute command

    @abstract
    @return {Object} info object with execution details
  */
  execute(props, context) { // eslint-disable-line
    throw new Error('Command.execute() is abstract.')
  }

  _getDocumentSession(props, context) {
    let docSession = props.documentSession || context.documentSession
    if (!docSession) {
      throw new Error("'documentSession' is required.")
    }
    return docSession
  }

  _getSelection(props) {
    let sel = props.selection || props.selectionState.getSelection()
    if (!sel) {
      throw new Error("'selection' is required.")
    }
    return sel
  }

}


export default Command

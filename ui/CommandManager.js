import extend from 'lodash/extend'
import forEach from 'lodash/forEach'
import isEqual from 'lodash/isEqual'
import Registry from '../util/Registry'

/*
  Listens to changes on the document and selection and updates registered tools accordingly.

  @class
*/
class CommandManager {

  constructor(context, commands) {
    if (!context.documentSession) {
      throw new Error('DocumentSession required.')
    }
    this.documentSession = context.documentSession
    this.context = extend({}, context, {
      // for convenienve we provide access to the doc directly
      doc: this.documentSession.getDocument()
    })

    // Set up command registry
    this.commandRegistry = new Registry()
    forEach(commands, function(command) {
      if(!command._isCommand) {
        throw new Error("Expecting instances of ui/Command.")
      }
      this.commandRegistry.add(command.name, command)
    }.bind(this))

    this.documentSession.on('update', this.updateCommandStates, this)

    this.updateCommandStates()
  }

  dispose() {
    this.documentSession.off(this)
  }

  getCommandContext() {
    return this.context
  }

  /*
    Compute new command states object
  */
  updateCommandStates() {
    let commandStates = {}
    let commandContext = this.getCommandContext()
    let props = this._getCommandProps()
    this.commandRegistry.forEach(function(cmd) {
      commandStates[cmd.getName()] = cmd.getCommandState(props, commandContext)
    })
    // poor-man's immutable style
    if (!isEqual(this.commandStates, commandStates)) {
      this.commandStates = commandStates
    }
  }

  /*
    Exposes the current commandStates object
  */
  getCommandStates() {
    return this.commandStates
  }

  /*
    Execute a command, given a context and arguments
  */
  executeCommand(commandName, props) {
    let cmd = this.commandRegistry.get(commandName)
    if (!cmd) {
      console.warn('command', commandName, 'not registered')
      return
    }
    let commandState = this.commandStates[commandName]
    props = extend(this._getCommandProps(), commandState, props)
    let info = cmd.execute(props, this.getCommandContext())
    // TODO: why do we required commands to return a result?
    if (info === undefined) {
      console.warn('command ', commandName, 'must return either an info object or true when handled or false when not handled')
    }
    return info
  }

  // TODO: while we need it here this should go into the flow thingie later
  _getCommandProps() {
    let documentSession = this.context.documentSession
    let selectionState = documentSession.getSelectionState()
    let sel = selectionState.getSelection()
    let surface = this.context.surfaceManager.getFocusedSurface()
    return {
      documentSession: documentSession,
      selectionState: selectionState,
      surface: surface,
      selection: sel
    }
  }

}

export default CommandManager

import extend from 'lodash/extend'
import forEach from '../util/forEach'
import isEqual from 'lodash/isEqual'
import Registry from '../util/Registry'

/*
  Listens to changes on the document and selection and updates the commandStates
  accordingly.

  @class CommandManager
*/
class CommandManager {

  constructor(context, commands) {
    if (!context.editSession) {
      throw new Error('DocumentSession required.')
    }
    this.editSession = context.editSession
    this.doc = this.editSession.getDocument()
    this.context = extend({}, context, {
      // for convenienve we provide access to the doc directly
      doc: this.doc
    })
    // Set up command registry
    this.commandRegistry = new Registry()
    forEach(commands, function(command) {
      if(!command._isCommand) {
        throw new Error("Expecting instances of ui/Command.")
      }
      this.commandRegistry.add(command.name, command)
    }.bind(this))

    this.editSession.on('model', this.onSessionUpdate, this)
    this.updateCommandStates(this.editSession)
  }

  dispose() {
    this.editSession.off(this)
  }

  onSessionUpdate(editSession) {
    if (editSession.hasChanged('change') || editSession.hasChanged('selection')) {
      this.updateCommandStates(editSession)
    }
  }

  /*
    Compute new command states object
  */
  updateCommandStates(editSession) {
    let commandStates = {}
    let commandContext = this.getCommandContext()
    let params = this._getCommandParams()
    this.commandRegistry.forEach(function(cmd) {
      commandStates[cmd.getName()] = cmd.getCommandState(params, commandContext)
    })
    // poor-man's immutable style
    if (!isEqual(this.commandStates, commandStates)) {
      this.commandStates = commandStates
      editSession.set('commandStates', commandStates)
    }
  }

  /*
    Execute a command, given a context and arguments
  */
  executeCommand(commandName, userParams) {
    let cmd = this.commandRegistry.get(commandName)
    if (!cmd) {
      console.warn('command', commandName, 'not registered')
      return
    }
    let commandState = this.commandStates[commandName]
    let params = extend(this._getCommandParams(), userParams, {
      commandState: commandState
    })
    let info = cmd.execute(params, this.getCommandContext())
    // TODO: why do we require commands to return a result?
    if (info === undefined) {
      console.warn('command ', commandName, 'must return either an info object or true when handled or false when not handled')
    }
    return info
  }

  /*
    Exposes the current commandStates object
  */
  getCommandStates() {
    return this.commandStates
  }

  getCommandContext() {
    return this.context
  }

  // TODO: while we need it here this should go into the flow thingie later
  _getCommandParams() {
    let editSession = this.context.editSession
    let selectionState = editSession.getSelectionState()
    let sel = selectionState.getSelection()
    let surface = this.context.surfaceManager.getFocusedSurface()
    return {
      editSession: editSession,
      selectionState: selectionState,
      surface: surface,
      selection: sel,
      //legacy
      documentSession: editSession,
    }
  }
}

export default CommandManager

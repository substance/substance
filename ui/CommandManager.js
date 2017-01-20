import extend from '../util/extend'
import forEach from '../util/forEach'
import isEqual from '../util/isEqual'
import Registry from '../util/Registry'

/*
  Listens to changes on the document and selection and updates the commandStates
  accordingly.

  @class CommandManager
*/
class CommandManager {

  constructor(context, commands) {
    if (!context.editorSession) {
      throw new Error('EditorSession required.')
    }

    this.editorSession = context.editorSession
    this.doc = this.editorSession.getDocument()
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

    this.editorSession.onUpdate(this.onSessionUpdate, this)
    this.updateCommandStates(this.editorSession)
  }

  dispose() {
    this.editorSession.off(this)
  }

  onSessionUpdate(editorSession) {
    if (editorSession.hasChanged('change') || editorSession.hasChanged('selection')) {
      this.updateCommandStates(editorSession)
    }
  }

  /*
    Compute new command states object
  */
  updateCommandStates(editorSession) {
    let commandStates = {}
    let commandContext = this.getCommandContext()
    let params = this._getCommandParams()
    this.commandRegistry.forEach(function(cmd) {
      commandStates[cmd.getName()] = cmd.getCommandState(params, commandContext)
    })
    // poor-man's immutable style
    if (!isEqual(this.commandStates, commandStates)) {
      this.commandStates = commandStates
      editorSession.setCommandStates(commandStates)
    }
  }

  /*
    Execute a command, given a context and arguments.

    Commands are run async if cmd.isAsync() returns true.
  */
  executeCommand(commandName, userParams, cb) {
    let cmd = this.commandRegistry.get(commandName)
    if (!cmd) {
      console.warn('command', commandName, 'not registered')
      return
    }
    let commandState = this.commandStates[commandName]
    let params = extend(this._getCommandParams(), userParams, {
      commandState: commandState
    })

    if (cmd.isAsync) {
      // TODO: Request UI lock here
      this.editorSession.lock()
      cmd.execute(params, this.getCommandContext(), (err, info) => {
        if (err) {
          if (cb) {
            cb(err)
          } else {
            console.error(err)
          }
        } else {
          if (cb) cb(null, info)
        }
        this.editorSession.unlock()
      })
    } else {
      let info = cmd.execute(params, this.getCommandContext())
      return info
    }
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
    let editorSession = this.context.editorSession
    let selectionState = editorSession.getSelectionState()
    let sel = selectionState.getSelection()
    let surface = this.context.surfaceManager.getFocusedSurface()
    return {
      editorSession: editorSession,
      selectionState: selectionState,
      surface: surface,
      selection: sel,
    }
  }
}

export default CommandManager

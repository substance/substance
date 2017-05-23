import { forEach, Registry } from '../util'

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
    this.context = Object.assign({}, context, {
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
    if (editorSession.hasChanged('change') || editorSession.hasChanged('selection') || editorSession.hasChanged('commandStates')) {
      this.updateCommandStates(editorSession)
    }
  }

  /*
    Compute new command states object
  */
  updateCommandStates(editorSession) {
    const commandContext = this.getCommandContext()
    const params = this._getCommandParams()
    const surface = params.surface
    const commandRegistry = this.commandRegistry

    // EXPERIMENTAL:
    // We want to control which commands are available
    // in each surface
    // Trying out a white-list and a black list
    // TODO: discuss, and maybe think about optimizing this
    // by caching the result...
    let commandNames = commandRegistry.names.slice()
    if (surface) {
      let included = surface.props.commands
      let excluded = surface.props.excludedCommands
      if (included) {
        commandNames = included
      } else if (excluded) {
        excluded = excluded.slice(0)
        for (let i = commandNames.length - 1; i >= 0; i--) {
          let idx = excluded.indexOf(commandNames[i])
          if (idx >= 0) {
            excluded.splice(idx, 1)
            commandNames.splice(i, 1)
          }
        }
      }
    }
    const commands = commandNames.map(name => commandRegistry.get(name))
    let commandStates = {}
    commands.forEach((cmd) => {
      if (cmd) {
        commandStates[cmd.getName()] = cmd.getCommandState(params, commandContext)
      }
    })
    // NOTE: We previously did a check if commandStates were actually changed
    // before updating them. However, we currently have complex objects
    // in the command state (e.g. EditInlineNodeCommand) so we had to remove it.
    // See Issue #1004
    this.commandStates = commandStates
    editorSession.setCommandStates(commandStates)
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
    let params = Object.assign(this._getCommandParams(), userParams, {
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

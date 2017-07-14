import { forEach, Registry, without } from '../util'

/*
  Listens to changes on the document and selection and updates the commandStates
  accordingly.

  The contract is that the CommandManager maintains a state for each
  command contributing to the global application state.
*/
export default class CommandManager {

  constructor(context, commands) {
    const editorSession = context.editorSession
    if (!editorSession) {
      throw new Error('EditorSession required.')
    }
    this.editorSession = context.editorSession
    // commands by name
    this.commands = commands

    // a context which is provided to the commands
    // for evaluation of state and for execution
    this.context = Object.assign({}, context, {
      // for convenienve we provide access to the doc directly
      doc: this.editorSession.getDocument()
    })

    // some initializations such as setting up a registry
    this._initialize()

    // on any update we will recompute
    this.editorSession.onUpdate(this._onSessionUpdate, this)

    // compute initial command states and
    // promote to editorSession
    this._updateCommandStates(this.editorSession)
  }

  dispose() {
    this.editorSession.off(this)
  }

  /*
    Execute a command, given a context and arguments.

    Commands are run async if cmd.isAsync() returns true.
  */
  executeCommand(commandName, userParams, cb) {
    let cmd = this._getCommand(commandName)
    if (!cmd) {
      console.warn('command', commandName, 'not registered')
      return
    }
    let commandStates = this.editorSession.getCommandStates()
    let commandState = commandStates[commandName]
    let params = Object.assign(this._getCommandParams(), userParams, {
      commandState: commandState
    })

    if (cmd.isAsync) {
      // TODO: Request UI lock here
      this.editorSession.lock()
      cmd.execute(params, this._getCommandContext(), (err, info) => {
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
      let info = cmd.execute(params, this._getCommandContext())
      return info
    }
  }

  _initialize() {
    this.commandRegistry = new Registry()
    forEach(this.commands, (command) => {
      this.commandRegistry.add(command.name, command)
    })
  }

  _getCommand(commandName) {
    return this.commandRegistry.get(commandName)
  }

  /*
    Compute new command states object
  */
  _updateCommandStates(editorSession) {
    const commandContext = this._getCommandContext()
    const params = this._getCommandParams()
    const surface = params.surface
    const commandRegistry = this.commandRegistry

    // TODO: discuss, and maybe think about optimizing this
    // by caching the result...
    let commandStates = {}
    let commandNames = commandRegistry.names.slice()
    // first assume that all of the commands are disabled
    commandNames.forEach((name) => {
      commandStates[name] = { disabled: true }
    })
    // EXPERIMENTAL: white-list and black-list support via Surface props
    if (surface) {
      let included = surface.props.commands
      let excluded = surface.props.excludedCommands
      if (included) {
        commandNames = included.map((name) => {
          if (commandRegistry.contains(name)){
            return name
          }
        })
      } else if (excluded) {
        commandNames = without(commandNames, ...excluded)
      }
    }
    const commands = commandNames.map(name => commandRegistry.get(name))
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

  _onSessionUpdate(editorSession) {
    if (editorSession.hasChanged('change') || editorSession.hasChanged('selection') || editorSession.hasChanged('commandStates')) {
      this._updateCommandStates(editorSession)
    }
  }

  _getCommandContext() {
    return this.context
  }

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

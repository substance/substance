import { last } from '../util'
import HandlerParams from './HandlerParams'

const DISABLED = Object.freeze({
  disabled: true
})

export default class CommandManager {
  constructor (editorSession, deps, commands) {
    this.editorSession = editorSession
    // commands are setup lazily so that we can take context into consideration
    // allowing to disable certain commands if they should not be considered
    // in a specifc context at all
    this._allCommands = commands
    this._commands = null

    editorSession.getEditorState().addObserver(deps, this.reduce, this, { stage: 'update' })
  }

  dispose () {
    this.editorSession.getEditorState().off(this)
  }

  initialize () {
    this._initializeCommands()
    this.reduce()
  }

  reduce () {
    const editorState = this.editorSession.getEditorState()
    const commandStates = this._getCommandStates()
    editorState.commandStates = commandStates
  }

  executeCommand (commandName, params = {}) {
    const editorState = this.editorSession.getEditorState()
    const cmdState = editorState.commandStates[commandName]
    if (!cmdState || cmdState.disabled) {
      return false
    } else {
      const commands = this._getCommands()
      const cmd = commands.get(commandName)
      const context = this.editorSession.getContext()
      params = Object.assign(new HandlerParams(context), params)
      params.commandState = cmdState
      cmd.execute(params, context)
      return true
    }
  }

  _getCommandStates () {
    if (!this._commands) this._initializeCommands()

    const editorState = this.editorSession.getEditorState()
    const context = this.editorSession.getContext()
    const params = new HandlerParams(context)
    const doc = editorState.document
    const sel = editorState.selection
    const selectionState = editorState.selectionState
    const isBlurred = editorState.isBlurred
    const noSelection = !sel || sel.isNull() || !sel.isAttached()

    const commandStates = Object.assign({}, this._allDisabled)
    // all editing commands are disabled if
    // - this editorSession is blurred,
    // - or the selection is null,
    // - or the selection is inside a custom editor
    if (!isBlurred && !noSelection && !sel.isCustomSelection()) {
      const path = sel.start.path
      const node = doc.get(path[0])

      // TODO: is this really necessary. It rather seems to be
      // a workaround for other errors, i.e., the selection pointing
      // to a non existing node
      // If really needed we should document why, and in which case.
      if (!node) {
        throw new Error('FIXME: explain when this happens')
      }

      const nodeProp = _getNodeProp(node, path)
      const isInsideText = nodeProp ? nodeProp.isText() : false

      // annotations can only be applied on PropertySelections inside
      // text, and not on an inline-node
      if (isInsideText && sel.isPropertySelection() && !selectionState.isInlineNodeSelection) {
        Object.assign(commandStates, _disabledIfDisallowedTargetType(this._annotationCommands, nodeProp.targetTypes, params, context))
      }

      // for InsertCommands the selection must be inside a ContainerEditor
      const containerPath = selectionState.containerPath
      if (containerPath) {
        const containerProp = doc.getProperty(containerPath)
        if (containerProp) {
          const targetTypes = containerProp.targetTypes
          Object.assign(commandStates, _disabledIfDisallowedTargetType(this._insertCommands, targetTypes, params, context))
          Object.assign(commandStates, _disabledIfDisallowedTargetType(this._switchTypeCommands, targetTypes, params, context))
        }
      }
    }

    // other commands must check their own preconditions
    Object.assign(commandStates, _getCommandStates(this._otherCommands, params, context))

    return commandStates
  }

  _getCommands () {
    if (!this._commands) {
      this._initializeCommands()
    }
    return this._commands
  }

  _initializeCommands () {
    const context = this.editorSession.getContext()
    const allCommands = Array.from(this._allCommands)
    // remove disabled all commands that revoke by inspecting the context
    const commands = new Map(allCommands.filter(([name, command]) => {
      // for legacy, keep commands enabled which do not proved a `shouldBeEnabled()` method
      return !command.shouldBeEnabled || command.shouldBeEnabled(context)
    }))
    const annotationCommands = []
    const insertCommands = []
    const switchTypeCommands = []
    const otherCommands = []
    commands.forEach(command => {
      if (command.isAnnotationCommand()) {
        annotationCommands.push(command)
      } else if (command.isInsertCommand()) {
        insertCommands.push(command)
      } else if (command.isSwitchTypeCommand()) {
        switchTypeCommands.push(command)
      } else {
        otherCommands.push(command)
      }
    })
    this._commands = commands
    this._annotationCommands = annotationCommands
    this._insertCommands = insertCommands
    this._switchTypeCommands = switchTypeCommands
    this._otherCommands = otherCommands
    this._allDisabled = _disabled(Array.from(commands.values()))
  }
}

function _getNodeProp (node, path) {
  if (path.length === 2) {
    const propName = last(path)
    const prop = node.getSchema().getProperty(propName)
    if (!prop) console.error('Could not find property for path', path, node)
    return prop
  }
}

function _disabled (commands) {
  return commands.reduce((m, c) => {
    m[c.getName()] = DISABLED
    return m
  }, {})
}

const EMPTY_SET = new Set()

function _disabledIfDisallowedTargetType (commands, targetTypes, params, context) {
  targetTypes = targetTypes || EMPTY_SET
  return commands.reduce((m, cmd) => {
    const type = cmd.getType()
    const name = cmd.getName()
    if (targetTypes.has(type)) {
      m[name] = cmd.getCommandState(params, context)
    } else {
      m[name] = DISABLED
    }
    return m
  }, {})
}

function _getCommandStates (commands, params, context) {
  return commands.reduce((m, command) => {
    m[command.getName()] = command.getCommandState(params, context)
    return m
  }, {})
}

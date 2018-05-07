import CommandManager from '../ui/CommandManager'

const DISABLED = Object.freeze({
  disabled: true
})

/*
  Experimental CommandManager that makes use of the XML schema
  to inhibit commands which are not allowed at the current position.
*/
export default class SchemaDrivenCommandManager extends CommandManager {

  _initialize() {
    // NOTE: So far insert inline commands fall into the annotationCommands
    // category (e.g. InsertXrefCommand)
    const annotationCommands = new Map()
    const insertCommands = new Map()
    const switchTypeCommands = new Map()
    const otherCommands = new Map()
    this.commands.forEach((command) => {
      const name = command.getName()
      if (command.isAnnotationCommand()) {
        annotationCommands.set(name, command)
      } else if (command.isInsertCommand()) {
        insertCommands.set(name, command)
      } else if (command.isSwitchTypeCommand()) {
        switchTypeCommands.set(name, command)
      } else {
        otherCommands.set(name, command)
      }
    })
    this.annotationCommands = annotationCommands
    this.insertCommands = insertCommands
    this.switchTypeCommands = switchTypeCommands
    this.otherCommands = otherCommands
  }

  _getCommand(commandName) {
    let cmd = this.annotationCommands.get(commandName) ||
      this.insertCommands.get(commandName) ||
      this.switchTypeCommands.get(commandName) ||
      this.otherCommands.get(commandName)
    return cmd
  }

  _updateCommandStates(editorSession) {
    const commandStates = {}
    const annotationCommands = this.annotationCommands
    const insertCommands = this.insertCommands
    const switchTypeCommands = this.switchTypeCommands
    const commandContext = this._getCommandContext()
    const params = this._getCommandParams()
    const doc = editorSession.getDocument()
    const selectionState = params.selectionState
    const sel = params.selection
    const isBlurred = params.editorSession.isBlurred()
    const noSelection = !sel || sel.isNull() || !sel.isAttached()

    // all editing commands are disabled if
    // - this editorSession is blurred,
    // - or the selection is null,
    // - or the selection is inside a custom editor
    if (isBlurred || noSelection || sel.isCustomSelection()) {
      _disableEditingCommands()
    } else {
      const path = sel.start.path
      const node = doc.get(path[0])

      // TODO: is this really necessary. It rather seems to be
      // a workaround for other errors, i.e., the selection pointing
      // to a non existing node
      // If really needed we should document why, and in which case.
      if (!node) {
        // FIXME: explain when this happens.'
        throw new Error('FIXME: explain when this happens')
      }

      const isInsideText = node.isText()
      const xmlSchema = doc.getXMLSchema()

      // annotations can only be applied on PropertySelections inside
      // text, and not on an inline-node
      if (isInsideText && sel.isPropertySelection() && !selectionState.isInlineNodeSelection()) {
        const elementSchema = xmlSchema.getElementSchema(node.type)
        _evaluateTyped(this.annotationCommands, elementSchema)
      } else {
        _disable(this.annotationCommands)
      }

      // for InsertCommands the selection must be inside a ContainerEditor
      let parentNode = node.parentNode
      if (!parentNode || !parentNode.isContainer()) {
        _disable(this.insertCommands)
      } else {
        // TODO: disable all commands with types that are not allowed
        // at the current position
        const elementSchema = xmlSchema.getElementSchema(parentNode.type)
        _evaluateTyped(this.insertCommands, elementSchema)
      }

      // SwitchTypeCommands can only be applied to
      // block-level text nodes
      if (!parentNode || !sel.containerId || !isInsideText || !parentNode.isContainer()) {
        _disable(this.switchTypeCommands)
      } else {
        // TODO: disable all commands with types that are not allowed
        // at the current position
        const elementSchema = xmlSchema.getElementSchema(parentNode.type)
        _evaluateTyped(this.switchTypeCommands, elementSchema)
      }
    }

    // other commands must check their own preconditions
    _evaluateUntyped(this.otherCommands)

    // ATTENTION: this does not reflow. We should refactor EditorSession
    // and make it more consistent
    editorSession.setCommandStates(commandStates)

    function _disableEditingCommands() {
      _disable(annotationCommands)
      _disable(insertCommands)
      _disable(switchTypeCommands)
    }

    function _disable(commands) {
      commands.forEach((cmd, name) => {
        commandStates[name] = DISABLED
      })
    }
    function _evaluateTyped(commands, elementSchema) {
      commands.forEach((cmd, name) => {
        const type = cmd.getType()
        if (elementSchema.isAllowed(type)) {
          commandStates[name] = cmd.getCommandState(params, commandContext)
        } else {
          commandStates[name] = DISABLED
        }
      })
    }
    function _evaluateUntyped(commands) {
      commands.forEach((cmd, name) => {
        commandStates[name] = cmd.getCommandState(params, commandContext)
      })
    }

  }
}

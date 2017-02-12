import isMatch from 'lodash-es/isMatch'
import find from 'lodash-es/find'
import clone from '../../util/clone'
import Command from '../../ui/Command'

class SwitchTextTypeCommand extends Command {
  // Available text types on the surface
  getTextTypes(params) {
    let surface = params.surface
    if (surface && surface.isContainerEditor()) {
      return surface.getTextTypes()
    } else {
      return []
    }
  }

  getTextType(params) {
    let textTypes = this.getTextTypes(params)
    return find(textTypes, function(t) {
      return t.name === params.textType
    })
  }

  // Search which textType matches the current node
  // E.g. {type: 'heading', level: 1} => heading1
  getCurrentTextType(params, node) {
    let textTypes = this.getTextTypes(params)
    let currentTextType
    textTypes.forEach(function(textType) {
      let nodeProps = clone(textType.data)
      delete nodeProps.type
      if (isMatch(node, nodeProps) && node.type === textType.data.type) {
        currentTextType = textType
      }
    })
    return currentTextType
  }

  isDisabled({selection, surface}) {
    if (!surface || !surface.isEnabled() || selection.isNull()) {
      return true
    }
    // When command is configured to be disabled for collapsed cursor
    if (selection && this.config.disableCollapsedCursor && selection.isCollapsed()) {
      return true
    }
    return false
  }

  getCommandState(params) {
    let doc = params.editorSession.getDocument()
    let sel = params.selection

    let node
    let newState = {
      disabled: false,
      textTypes: this.getTextTypes(params)
    }
    // Set disabled when not a property selection
    if (this.isDisabled(params)) {
      newState.disabled = true
    } else if (sel.isContainerSelection()) {
      newState.disabled = true
      newState.currentTextType = {name: 'container-selection'}
    } else if (sel.isPropertySelection()) {
      let path = sel.getPath()
      node = doc.get(path[0])
      // There are cases where path points to an already deleted node,
      // so we need to guard node
      if (node) {
        if (node.isText() && node.isBlock()) {
          newState.currentTextType = this.getCurrentTextType(params, node)
        }
        if (!newState.currentTextType) {
          // We 'abuse' the currentTextType field by providing a property
          // identifier that is translated into a name using an default label set.
          // E.g. this.getLabel('figure.caption') -> Figure Caption
          newState.currentTextType = {name: [node.type, path[1]].join('.')}
          newState.disabled = true
        }
      }
    } else if (sel.isNodeSelection()) {
      node = doc.get(sel.getNodeId())
      newState.currentTextType = {name: node.type}
      newState.disabled = true
    } else if (sel.isCustomSelection()) {
      newState.currentTextType = {name: 'custom'}
      newState.disabled = true
    }
    return newState
  }

  /**
    Trigger a switchTextType transaction
   */
  execute(params) {
    let textType = this.getTextType(params)
    let nodeData = textType.data
    let surface = params.surface
    let editorSession = params.editorSession
    if (!surface) {
      console.warn('No focused surface. Stopping command execution.')
      return
    }
    editorSession.transaction(function(tx) {
      return tx.switchTextType(nodeData)
    })
    return nodeData
  }
}

export default SwitchTextTypeCommand

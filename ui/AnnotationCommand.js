import Command from './Command'
import annotationHelpers from '../model/annotationHelpers'

/**
  A class for commands intended to be executed on the annotations.

  See the example below to learn how to register an `AnnotationCommand`
  for a strong annotation.

  @class AnnotationCommand
  @extends ui/Command

  @example

  ```js
  import { AnnotationCommand } from 'substance'

  config.addCommand('strong', AnnotationCommand, {nodeType: 'strong'})
  // Disable, when cursor is collapsed
  config.addCommand('strong', AnnotationCommand, {
    nodeType: 'strong',
    disableCollapsedCursor: true
  })
  ```
*/

class AnnotationCommand extends Command {

  constructor(...args) {
    super(...args)

    if (!this.config.nodeType) {
      throw new Error("'nodeType' is required")
    }
  }

  /**
    Get the type of an annotation.

    @returns {String} The annotation's type.
   */
  getAnnotationType() {
    return this.config.nodeType
  }

  /**
    Get the annotation's data.

    @returns {Object} The annotation's data.
   */
  getAnnotationData() {
    return {}
  }

  /**
    Checks if command couldn't be executed with current selection.

    @param {Array} annos annotations
    @param {Object} sel selection

    @returns {Boolean} Whether or not command could be executed.
   */
  isDisabled(sel) {
    // TODO: Container selections should be valid if the annotation type
    // is a container annotation. Currently we only allow property selections.
    if (!sel || sel.isNull() || !sel.isAttached() || sel.isCustomSelection()||
        sel.isNodeSelection() || sel.isContainerSelection()) {
      return true
    }

    if (this.config.disableCollapsedCursor && sel.isCollapsed()) {
      return true
    }

    return false
  }

  /**
    Checks if new annotations could be created.
    There should be no annotation overlapping, selection must be not collapsed.

    @param {Array} annos annotations
    @param {Object} sel selection

    @returns {Boolean} Whether or not annotation could be created.
   */
  // When there's no existing annotation overlapping, we create a new one.
  canCreate(annos, sel) {
    return (annos.length === 0 && !sel.isCollapsed())
  }

  /**
    Checks if annotations could be fused.
    There should be more than one annotation overlaped by current selection.

    @param {Array} annos annotations
    @param {Object} sel selection

    @returns {Boolean} Whether or not annotations could be fused.
   */
  canFuse(annos, sel) {
    // When more than one annotation overlaps with the current selection
    return (annos.length >= 2 && !sel.isCollapsed())
  }

  /**
    Checks if annotation could be deleted.
    Cursor or selection must be inside an existing annotation.

    @param {Array} annos annotations
    @param {Object} sel selection

    @returns {Boolean} Whether or not annotation could be deleted.
   */
  canDelete(annos, sel) {
    // When the cursor or selection is inside an existing annotation
    if (annos.length !== 1) return false
    let annoSel = annos[0].getSelection()
    return sel.isInsideOf(annoSel)
  }

  /**
    Checks if annotation could be expanded.
    There should be overlap with only a single annotation,
    selection should be also outside of this annotation.

    @param {Array} annos annotations
    @param {Object} sel selection

    @returns {Boolean} Whether or not annotation could be expanded.
   */
  canExpand(annos, sel) {
    // When there's some overlap with only a single annotation we do an expand
    if (annos.length !== 1) return false
    let annoSel = annos[0].getSelection()
    return sel.overlaps(annoSel) && !sel.isInsideOf(annoSel)
  }

  /**
    Checks if annotation could be truncated.
    There should be overlap with only a single annotation,
    selection should also have boundary in common with this annotation.

    @param {Array} annos annotations
    @param {Object} sel selection

    @returns {Boolean} Whether or not annotation could be truncated.
   */
  canTruncate(annos, sel) {
    if (annos.length !== 1) return false
    let annoSel = annos[0].getSelection()

    return (sel.isLeftAlignedWith(annoSel) || sel.isRightAlignedWith(annoSel)) &&
           !sel.contains(annoSel) &&
           !sel.isCollapsed()
  }

  /**
    Gets command state object.

    @param {Object} state.selection the current selection
    @returns {Object} info object with command details.
  */
  getCommandState(params) { // eslint-disable-line

    let sel = this._getSelection(params)
    // We can skip all checking if a disabled condition is met
    // E.g. we don't allow toggling of property annotations when current
    // selection is a container selection
    if (this.isDisabled(sel)) {
      return {
        disabled: true
      }
    }
    let annos = this._getAnnotationsForSelection(params)
    let newState = {
      disabled: false,
      active: false,
      mode: null
    }
    if (this.canCreate(annos, sel)) {
      newState.mode = 'create'
    } else if (this.canFuse(annos, sel)) {
      newState.mode = 'fuse'
    } else if (this.canTruncate(annos, sel)) {
      newState.active = true
      newState.mode = 'truncate'
    } else if (this.canExpand(annos, sel)) {
      newState.mode = 'expand'
    } else if (this.canDelete(annos, sel)) {
      newState.active = true
      newState.mode = 'delete'
    } else {
      newState.disabled = true
    }
    return newState
  }

  /**
    Execute command and trigger transformation.

    @returns {Object} info object with execution details.
  */
  // Execute command and trigger transformations
  execute(params) {
    // Disabled the next line as I believe it is
    // always passed via params already
    // params.selection = this._getSelection(params)
    let commandState = params.commandState

    if (commandState.disabled) return false
    switch(commandState.mode) {
      case 'create':
        return this.executeCreate(params)
      case 'fuse':
        return this.executeFuse(params)
      case 'truncate':
        return this.executeTruncate(params)
      case 'expand':
        return this.executeExpand(params)
      case 'delete':
        return this.executeDelete(params)
      default:
        console.warn('Command.execute(): unknown mode', commandState.mode)
        return false
    }
  }

  executeCreate(params) {
    let annos = this._getAnnotationsForSelection(params)
    this._checkPrecondition(params, annos, this.canCreate)
    let editorSession = this._getEditorSession(params)
    let annoData = this.getAnnotationData()
    annoData.type = this.getAnnotationType()
    let anno
    editorSession.transaction((tx) => {
      anno = tx.annotate(annoData)
    })
    return {
      mode: 'create',
      anno: anno
    }
  }

  executeFuse(params) {
    let annos = this._getAnnotationsForSelection(params);
    this._checkPrecondition(params, annos, this.canFuse);
    this._applyTransform(params, function(tx) {
      annotationHelpers.fuseAnnotation(tx, annos)
    })
    return {
      mode: 'fuse',
      anno: annos[0]
    }
  }

  executeTruncate(params) {
    let annos = this._getAnnotationsForSelection(params)
    let anno = annos[0]
    this._checkPrecondition(params, annos, this.canTruncate)
    this._applyTransform(params, function(tx) {
      annotationHelpers.truncateAnnotation(tx, anno, params.selection)
    })
    return {
      mode: 'truncate',
      anno: anno
    }
  }

  executeExpand(params) {
    let annos = this._getAnnotationsForSelection(params)
    let anno = annos[0]
    this._checkPrecondition(params, annos, this.canExpand)
    this._applyTransform(params, function(tx) {
      annotationHelpers.expandAnnotation(tx, anno, params.selection)
    })
    return {
      mode: 'expand',
      anno: anno
    }
  }

  executeDelete(params) {
    let annos = this._getAnnotationsForSelection(params)
    let anno = annos[0]
    this._checkPrecondition(params, annos, this.canDelete)
    this._applyTransform(params, function(tx) {
      return tx.delete(anno.id)
    })
    return {
      mode: 'delete',
      annoId: anno.id
    }
  }

  _checkPrecondition(params, annos, checker) {
    let sel = this._getSelection(params)
    if (!checker.call(this, annos, sel)) {
      throw new Error("AnnotationCommand: can't execute command for selection " + sel.toString())
    }
  }

  _getAnnotationsForSelection(params) {
    return params.selectionState.getAnnotationsForType(this.getAnnotationType())
  }

  /**
    Apply an annotation transformation.

    @returns {Object} transformed annotations.
   */
  _applyTransform(params, transformFn) {
    let sel = this._getSelection(params)
    if (sel.isNull()) return

    let editorSession = this._getEditorSession(params)
    let result // to store transform result
    editorSession.setSelection(sel)
    editorSession.transaction(function(tx) {
      let out = transformFn(tx, params)
      if (out) result = out.result
    })
    return result
  }

}

export default AnnotationCommand

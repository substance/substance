import extend from 'lodash/extend'
import uuid from '../../util/uuid'
import helpers from '../documentHelpers'

/**
  For a given container selection create property selections of a given type

  @param {model/TransactionDocument} tx the document instance
  @param {model/Selection} args.selection A document selection
  @param {String} args.containerId a valid container id
  @param {Object} args.node data describing the annotation node

  @example

  ```js
  createAnnotation(tx, {
    selection: bodyEditor.getSelection(),
    node: {
      type: 'link',
      url: 'http://example.com'
    }
  });
  ```
*/
function createAnnotation(tx, args) {
  let sel = args.selection
  if (!sel) throw new Error('selection is required.')
  let anno = args.node
  if (!anno) throw new Error('node is required')

  if (!sel.isPropertySelection() && !sel.isContainerSelection() || sel.isCollapsed()) {
    // the selection must be expanded and of type Property- or ContainerSelection
    throw new Error("Invalid selection for createAnnotation")
  }
  // Special case: We split the current container selection into
  // multiple property annotations
  if (sel.isContainerSelection() && args.splitContainerSelections) {
    return _createPropertyAnnotations(tx, args)
  }
  if (helpers.isContainerAnnotation(tx, anno.type)) {
    anno.startPath = sel.startPath
    anno.endPath = sel.endPath
    anno.containerId = sel.containerId
  } else if (sel.isPropertySelection()) {
    anno.path = tx.getRealPath(sel.path)
  } else {
    throw new Error('Illegal state: can not apply ContainerSelection')
  }
  anno.startOffset = sel.startOffset
  anno.endOffset = sel.endOffset
  args.result = tx.create(anno)
  return args
}

function _createPropertyAnnotations(tx, args) {
  let sel = args.selection
  let node = args.node
  let sels
  if (sel.isPropertySelection()) {
    sels = []; // we just do nothing in the property selection case? why?
  } else if (sel.isContainerSelection()) {
    sels = sel.splitIntoPropertySelections()
  }

  for (let i = 0; i < sels.length; i++) {
    let anno = {
      id: uuid(node.type)
    }
    extend(anno, node)
    anno.path = tx.getRealPath(sels[i].getPath())
    anno.startOffset = sels[i].startOffset
    anno.endOffset = sels[i].endOffset
    tx.create(anno)
  }
}

export default createAnnotation

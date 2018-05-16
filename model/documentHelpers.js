import filter from '../util/filter'
import flatten from '../util/flatten'
import forEach from '../util/forEach'
import isArray from '../util/isArray'
import isArrayEqual from '../util/isArrayEqual'
import DocumentIndex from './DocumentIndex'
import annotationHelpers from './annotationHelpers'
import { isEntirelySelected } from './selectionHelpers'

/**
  For a given selection get all property annotations

  @param {Document} doc
  @param {Selection} sel
  @return {PropertyAnnotation[]} An array of property annotations.
          Returns an empty array when selection is a container selection.
*/
export function getPropertyAnnotationsForSelection (doc, sel, options) {
  options = options || {}
  if (!sel.isPropertySelection()) {
    return []
  }
  let path = sel.getPath()
  let annotations = doc.getIndex('annotations').get(path, sel.start.offset, sel.end.offset)
  if (options.type) {
    annotations = filter(annotations, DocumentIndex.filterByType(options.type))
  }
  return annotations
}

/**
  For a given selection get all container annotations

  @param {Document} doc
  @param {Selection} sel
  @param {String} containerId
  @param {String} options.type provides only annotations of that type
  @return {Array} An array of container annotations
*/
export function getContainerAnnotationsForSelection (doc, sel, containerId, options) {
  // ATTENTION: looking for container annotations is not as efficient as property
  // selections, as we do not have an index that has notion of the spatial extend
  // of an annotation. Opposed to that, common annotations are bound
  // to properties which make it easy to lookup.
  /* istanbul ignore next */
  if (!containerId) {
    throw new Error("'containerId' is required.")
  }
  options = options || {}
  let index = doc.getIndex('container-annotations')
  let annotations = []
  if (index) {
    annotations = index.get(containerId, options.type)
    annotations = filter(annotations, function (anno) {
      return sel.overlaps(anno.getSelection())
    })
  }
  return annotations
}

/**
  @param {Document} doc
  @param {String} type
  @return {Boolean} `true` if given type is a {@link ContainerAnnotation}
*/
export function isContainerAnnotation (doc, type) {
  let schema = doc.getSchema()
  return schema.isInstanceOf(type, 'container-annotation')
}

/**
  For a given selection, get the corresponding text string

  @param {Document} doc
  @param {Selection} sel
  @return {string} text enclosed by the annotation
*/
export function getTextForSelection (doc, sel) {
  if (!sel || sel.isNull()) {
    return ''
  } else if (sel.isPropertySelection()) {
    let text = doc.get(sel.start.path)
    return text.substring(sel.start.offset, sel.end.offset)
  } else if (sel.isContainerSelection()) {
    let result = []
    let nodeIds = sel.getNodeIds()
    let L = nodeIds.length
    for (let i = 0; i < L; i++) {
      let id = nodeIds[i]
      let node = doc.get(id)
      if (node.isText()) {
        let text = node.getText()
        if (i === L - 1) {
          text = text.slice(0, sel.end.offset)
        }
        if (i === 0) {
          text = text.slice(sel.start.offset)
        }
        result.push(text)
      }
    }
    return result.join('\n')
  }
}

export function getMarkersForSelection (doc, sel) {
  // only PropertySelections are supported right now
  if (!sel || !sel.isPropertySelection()) return []
  const path = sel.getPath()
  // markers are stored as one hash for each path, grouped by marker key
  let markers = doc.getIndex('markers').get(path)
  const filtered = filter(markers, function (m) {
    return m.containsSelection(sel)
  })
  return filtered
}

/*
  Deletes a node and its children and attached annotations
  and removes it from a given container
*/
export function deleteNode (doc, node) {
  /* istanbul ignore next */
  if (!node) {
    console.warn('Invalid arguments')
    return
  }
  // TODO: bring back support for container annotations
  if (node.isText()) {
    // remove all associated annotations
    let annos = doc.getIndex('annotations').get(node.id)
    for (let i = 0; i < annos.length; i++) {
      doc.delete(annos[i].id)
    }
  }
  // delete recursively
  // ATM we do a cascaded delete if the property has type 'id' or ['array', 'id'] and property 'owned' set,
  // or if it 'file'
  let nodeSchema = node.getSchema()
  forEach(nodeSchema, (prop) => {
    if ((prop.isReference() && prop.isOwned()) || (prop.type === 'file')) {
      if (prop.isArray()) {
        let ids = node[prop.name]
        ids.forEach((id) => {
          deleteNode(doc, doc.get(id))
        })
      } else {
        deleteNode(doc, doc.get(node[prop.name]))
      }
    }
  })
  doc.delete(node.id)
}

/*
  Creates a 'deep' JSON copy of a node returning an array of JSON objects
  that can be used to create the object tree owned by the given root node.

  @param {DocumentNode} node
*/
export function copyNode (node) {
  let nodes = []
  // EXPERIMENTAL: using schema reflection to determine whether to do a 'deep' copy or just shallow
  let nodeSchema = node.getSchema()
  let doc = node.getDocument()
  forEach(nodeSchema, (prop) => {
    // ATM we do a cascaded copy if the property has type 'id', ['array', 'id'] and is owned by the node,
    // or it is of type 'file'
    if ((prop.isReference() && prop.isOwned()) || (prop.type === 'file')) {
      let val = node[prop.name]
      nodes.push(_copyChildren(val))
    }
  })
  nodes.push(node.toJSON())
  let annotationIndex = node.getDocument().getIndex('annotations')
  let annotations = annotationIndex.get([node.id])
  forEach(annotations, function (anno) {
    nodes.push(anno.toJSON())
  })
  let result = flatten(nodes).filter(Boolean)
  // console.log('copyNode()', node, result)
  return result

  function _copyChildren (val) {
    if (!val) return null
    if (isArray(val)) {
      return flatten(val.map(_copyChildren))
    } else {
      let id = val
      if (!id) return null
      let child = doc.get(id)
      if (!child) return
      return copyNode(child)
    }
  }
}

/*
  <-->: anno
  |--|: area of change
  I: <--> |--|     :   nothing
  II: |--| <-->    :   move both by total span
  III: |-<-->-|    :   delete anno
  IV: |-<-|->      :   move start by diff to start, and end by total span
  V: <-|->-|       :   move end by diff to start
  VI: <-|--|->     :   move end by total span
*/
export function deleteTextRange (doc, start, end) {
  if (!start) {
    start = {
      path: end.path,
      offset: 0
    }
  }
  let path = start.path
  let text = doc.get(path)
  if (!end) {
    end = {
      path: start.path,
      offset: text.length
    }
  }
  /* istanbul ignore next */
  if (!isArrayEqual(start.path, end.path)) {
    throw new Error('start and end must be on one property')
  }
  let startOffset = start.offset
  if (startOffset < 0) throw new Error('start offset must be >= 0')
  let endOffset = end.offset
  if (endOffset > text.length) throw new Error('end offset must be smaller than the text length')

  doc.update(path, { type: 'delete', start: startOffset, end: endOffset })
  // update annotations
  let annos = doc.getAnnotations(path)
  annos.forEach(function (anno) {
    let annoStart = anno.start.offset
    let annoEnd = anno.end.offset
    // I anno is before
    if (annoEnd <= startOffset) {

    // II anno is after
    } else if (annoStart >= endOffset) {
      doc.update([anno.id, 'start'], { type: 'shift', value: startOffset - endOffset })
      doc.update([anno.id, 'end'], { type: 'shift', value: startOffset - endOffset })
    // III anno is deleted
    } else if (annoStart >= startOffset && annoEnd <= endOffset) {
      doc.delete(anno.id)
    // IV anno.start between and anno.end after
    } else if (annoStart >= startOffset && annoEnd >= endOffset) {
      if (annoStart > startOffset) {
        doc.update([anno.id, 'start'], { type: 'shift', value: startOffset - annoStart })
      }
      doc.update([anno.id, 'end'], { type: 'shift', value: startOffset - endOffset })
    // V anno.start before and anno.end between
    } else if (annoStart <= startOffset && annoEnd <= endOffset) {
      doc.update([anno.id, 'end'], { type: 'shift', value: startOffset - annoEnd })
    // VI anno.start before and anno.end after
    } else if (annoStart < startOffset && annoEnd >= endOffset) {
      doc.update([anno.id, 'end'], { type: 'shift', value: startOffset - endOffset })
    } else {
      console.warn('TODO: handle annotation update case.')
    }
  })
}

export function deleteListRange (doc, list, start, end) {
  if (doc !== list.getDocument()) {
    list = doc.get(list.id)
  }
  let startItem, endItem
  if (!start) {
    startItem = list.getItemAt(0)
    start = {
      path: startItem.getPath(),
      offset: 0
    }
  } else {
    startItem = doc.get(start.path[0])
  }
  if (!end) {
    endItem = list.getLastItem()
    end = {
      path: endItem.getPath(),
      offset: endItem.getLength()
    }
  } else {
    endItem = doc.get(end.path[0])
  }
  let startPos = list.getItemPosition(startItem)
  let endPos = list.getItemPosition(endItem)
  // range within the same item
  if (startPos === endPos) {
    deleteTextRange(doc, start, end)
    return
  }
  // normalize the range if it is 'reverse'
  if (startPos > endPos) {
    [start, end] = [end, start];
    [startPos, endPos] = [endPos, startPos];
    [startItem, endItem] = [endItem, startItem]
  }
  let firstEntirelySelected = isEntirelySelected(doc, startItem, start, null)
  let lastEntirelySelected = isEntirelySelected(doc, endItem, null, end)

  // delete or truncate last node
  if (lastEntirelySelected) {
    list.removeItemAt(endPos)
    deleteNode(doc, endItem)
  } else {
    deleteTextRange(doc, null, end)
  }

  // delete inner nodes
  let items = list.getItems()
  for (let i = endPos - 1; i > startPos; i--) {
    let item = items[i]
    list.removeItemAt(i)
    deleteNode(doc, item)
  }

  // delete or truncate the first node
  if (firstEntirelySelected) {
    // NOTE: this does not work well, because then
    // the item where the selection remains would have gone
    // list.removeItemAt(startPos)
    // deleteNode(doc, startItem)
    deleteTextRange(doc, start, null)
  } else {
    deleteTextRange(doc, start, null)
  }

  if (!firstEntirelySelected && !lastEntirelySelected) {
    mergeListItems(doc, list.id, startPos)
  }
}

export function mergeListItems (doc, listId, itemPos) {
  // HACK: make sure that the list is really from the doc
  let list = doc.get(listId)
  let targetItem = list.getItemAt(itemPos)
  let targetPath = targetItem.getPath()
  let targetLength = targetItem.getLength()
  let sourceItem = list.getItemAt(itemPos + 1)
  let sourcePath = sourceItem.getPath()
  // hide source
  list.removeItemAt(itemPos + 1)
  // append the text
  doc.update(targetPath, { type: 'insert', start: targetLength, text: sourceItem.getText() })
  // transfer annotations
  annotationHelpers.transferAnnotations(doc, sourcePath, 0, targetPath, targetLength)
  deleteNode(doc, sourceItem)
}

export function getNodes (doc, ids) {
  return ids.map((id) => {
    return doc.get(id, 'strict')
  })
}

// used by transforms copy, paste
// and by ClipboardImporter/Exporter
export const SNIPPET_ID = 'snippet'
export const TEXT_SNIPPET_ID = 'text-snippet'

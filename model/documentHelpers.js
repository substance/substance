import annotationHelpers from './annotationHelpers'
import DocumentIndex from './DocumentIndex'
import filter from '../util/filter'
import flatten from '../util/flatten'
import flattenOften from '../util/flattenOften'
import forEach from '../util/forEach'
import isArray from '../util/isArray'
import isArrayEqual from '../util/isArrayEqual'
import isString from '../util/isString'
import isFunction from '../util/isFunction'
import {
  isEntirelySelected, getNodeIdsCoveredByContainerSelection
} from './selectionHelpers'
import hasOwnProperty from '../util/hasOwnProperty'

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
  const path = sel.getPath()
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
  @param {String} containerPath
  @param {String} options.type provides only annotations of that type
  @return {Array} An array of container annotations
*/
export function getContainerAnnotationsForSelection (doc, sel, containerPath, options) {
  // ATTENTION: looking for container annotations is not as efficient as property
  // selections, as we do not have an index that has notion of the spatial extend
  // of an annotation. Opposed to that, common annotations are bound
  // to properties which make it easy to lookup.
  /* istanbul ignore next */
  if (!containerPath) {
    throw new Error("'containerPath' is required.")
  }
  options = options || {}
  const index = doc.getIndex('container-annotations')
  let annotations = []
  if (index) {
    annotations = index.get(containerPath, options.type)
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
  const schema = doc.getSchema()
  return schema.isInstanceOf(type, '@container-annotation')
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
    const text = doc.get(sel.start.path)
    return text.substring(sel.start.offset, sel.end.offset)
  } else if (sel.isContainerSelection()) {
    const result = []
    const nodeIds = getNodeIdsCoveredByContainerSelection(doc, sel)
    const L = nodeIds.length
    for (let i = 0; i < L; i++) {
      const id = nodeIds[i]
      const node = doc.get(id)
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
  const markers = doc.getIndex('markers').get(path)
  const filtered = filter(markers, function (m) {
    return m.containsSelection(sel)
  })
  return filtered
}

export function deleteNode (doc, node) {
  console.error('DEPRECATED: use documentHelpers.deepDeleteNode() instead')
  return deepDeleteNode(doc, node)
}

/*
  Deletes a node and its children and attached annotations
  and removes it from a given container
*/
export function deepDeleteNode (doc, node) {
  /* istanbul ignore next */
  if (!node) {
    console.warn('Invalid arguments')
    return
  }
  if (isString(node)) {
    node = doc.get(node)
  }
  // TODO: bring back support for container annotations
  if (node.isText()) {
    // remove all associated annotations
    const annos = doc.getIndex('annotations').get(node.id)
    for (let i = 0; i < annos.length; i++) {
      doc.delete(annos[i].id)
    }
  }
  const nodeSchema = node.getSchema()
  // remove all references to this node
  removeReferences(doc, node)

  // remove all children
  // Note: correct order of deletion is tricky here.
  // 1. annos attached to text properties
  // 2. the node itself
  // 3. nodes that are referenced via owned properties
  for (const prop of nodeSchema) {
    if (prop.isText()) {
      const annos = doc.getAnnotations([node.id, prop.name])
      for (const anno of annos) {
        deepDeleteNode(doc, anno)
      }
    }
  }
  doc.delete(node.id)
  // Recursive deletion of owned nodes
  // 1. delete all 'owned' references to child nodes
  // 2. delete all annos belonging to text properties
  for (const prop of nodeSchema) {
    if (prop.isOwned()) {
      const value = node.get(prop.name)
      if (prop.isArray()) {
        let ids = value
        if (ids.length > 0) {
          // property can be a matrix
          if (isArray(ids[0])) ids = flattenOften(ids, 2)
          ids.forEach((id) => {
            deepDeleteNode(doc, doc.get(id))
          })
        }
      } else {
        deepDeleteNode(doc, doc.get(value))
      }
    }
  }
}

export function removeReferences (doc, node) {
  const relIndex = doc.getIndex('relationships')
  if (!relIndex) {
    console.warning('Can not remove references without out relationships index')
    return
  }
  const nodeId = node.id
  const refererIds = relIndex.get(nodeId)
  for (const id of refererIds) {
    const referer = doc.get(id)
    const relProps = referer.getSchema().getRelationshipProperties()
    for (const prop of relProps) {
      const propName = prop.name
      if (prop.isArray()) {
        const ids = referer.get(propName)
        const offset = ids.indexOf(nodeId)
        if (offset >= 0) {
          doc.update([referer.id, propName], { type: 'delete', offset })
        }
      } else {
        const id = referer.get(propName)
        if (id === nodeId) {
          doc.set([referer.id, propName], null)
        }
      }
    }
  }
}

/*
  Creates a 'deep' JSON copy of a node returning an array of JSON objects
  that can be used to create the object tree owned by the given root node.

  @param {DocumentNode} node
*/
export function copyNode (node) {
  const nodes = []
  // using schema reflection to determine whether to do a 'deep' copy or just shallow
  const doc = node.getDocument()
  const nodeSchema = node.getSchema()
  for (const prop of nodeSchema) {
    // ATM we do a cascaded copy if the property has type 'id', ['array', 'id'] and is owned by the node,
    if (prop.isReference() && prop.isOwned()) {
      const val = node.get(prop.name)
      nodes.push(_copyChildren(val))
    }
  }
  nodes.push(node.toJSON())
  const annotationIndex = node.getDocument().getIndex('annotations')
  const annotations = annotationIndex.get([node.id])
  forEach(annotations, function (anno) {
    nodes.push(anno.toJSON())
  })
  const result = flatten(nodes).filter(Boolean)
  // console.log('copyNode()', node, result)
  return result

  function _copyChildren (val) {
    if (!val) return null
    if (isArray(val)) {
      return flatten(val.map(_copyChildren))
    } else {
      const id = val
      if (!id) return null
      const child = doc.get(id)
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
  const path = start.path
  const text = doc.get(path)
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
  const startOffset = start.offset
  if (startOffset < 0) throw new Error('start offset must be >= 0')
  const endOffset = end.offset
  if (endOffset > text.length) throw new Error('end offset must be smaller than the text length')

  doc.update(path, { type: 'delete', start: startOffset, end: endOffset })
  // update annotations
  const annos = doc.getAnnotations(path)
  annos.forEach(function (anno) {
    const annoStart = anno.start.offset
    const annoEnd = anno.end.offset
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

export function deleteListRange (doc, list, start, end, options = {}) {
  // HACK: resolving the right node
  // TODO: we should not do this, instead fix the calling code
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
  const firstEntirelySelected = isEntirelySelected(doc, startItem, start, null)
  const lastEntirelySelected = isEntirelySelected(doc, endItem, null, end)

  // delete or truncate last node
  if (lastEntirelySelected) {
    list.removeItemAt(endPos)
    deepDeleteNode(doc, endItem)
  } else {
    deleteTextRange(doc, null, end)
  }

  // delete inner nodes
  const items = list.getItems()
  for (let i = endPos - 1; i > startPos; i--) {
    const item = items[i]
    list.removeItemAt(i)
    deepDeleteNode(doc, item)
  }

  // delete or truncate the first node
  if (firstEntirelySelected) {
    // NOTE: this does not work well, because then
    // the item where the selection remains would have gone
    // But when used by copySelection to truncate head and tail
    // we want this.
    if (options.deleteEmptyFirstItem) {
      list.removeItemAt(startPos)
      deepDeleteNode(doc, startItem)
    } else {
      deleteTextRange(doc, start, null)
    }
  } else {
    deleteTextRange(doc, start, null)
  }

  if (!firstEntirelySelected && !lastEntirelySelected) {
    mergeListItems(doc, list.id, startPos)
  }
}

export function setText (doc, textPath, text) {
  const oldText = doc.get(textPath)
  if (oldText.length > 0) {
    deleteTextRange(doc, { path: textPath, offset: 0 })
  }
  doc.update(textPath, { type: 'insert', start: 0, text })
  return this
}

export function mergeListItems (doc, listId, itemPos) {
  // HACK: make sure that the list is really from the doc
  const list = doc.get(listId)
  const targetItem = list.getItemAt(itemPos)
  const targetPath = targetItem.getPath()
  const targetLength = targetItem.getLength()
  const sourceItem = list.getItemAt(itemPos + 1)
  const sourcePath = sourceItem.getPath()
  // hide source
  list.removeItemAt(itemPos + 1)
  // append the text
  doc.update(targetPath, { type: 'insert', start: targetLength, text: sourceItem.getText() })
  // transfer annotations
  annotationHelpers.transferAnnotations(doc, sourcePath, 0, targetPath, targetLength)
  deepDeleteNode(doc, sourceItem)
}

// used by transforms copy, paste
export const SNIPPET_ID = 'snippet'
export const TEXT_SNIPPET_ID = 'text-snippet'

export function insertAt (doc, containerPath, pos, id) {
  doc.update(containerPath, { type: 'insert', pos, value: id })
}

export function append (doc, containerPath, id) {
  insertAt(doc, containerPath, doc.get(containerPath).length, id)
}

/**
 * Removes an item from a CHILDREN or CONTAINER property.
 *
 * @param {Document} doc
 * @param {string[]} containerPath
 * @param {number} pos
 * @returns the id of the removed child
 */
export function removeAt (doc, containerPath, pos) {
  const op = doc.update(containerPath, { type: 'delete', pos })
  if (op && op.diff) {
    return op.diff.val
  }
}

export function removeFromCollection (doc, containerPath, id) {
  const index = doc.get(containerPath).indexOf(id)
  if (index >= 0) {
    return removeAt(doc, containerPath, index)
  }
  return false
}

export function getNodesForPath (doc, containerPath) {
  const ids = doc.get(containerPath)
  return getNodesForIds(doc, ids)
}

export function getNodesForIds (doc, ids) {
  return ids.map(id => doc.get(id, 'strict'))
}

export function getNodeAt (doc, containerPath, nodePos) {
  const ids = doc.get(containerPath)
  return doc.get(ids[nodePos])
}

export function getPreviousNode (doc, containerPath, nodePos) {
  if (nodePos > 0) {
    return getNodeAt(doc, containerPath, nodePos - 1)
  }
}

export function getNextNode (doc, containerPath, nodePos) {
  return getNodeAt(doc, containerPath, nodePos + 1)
}

export { default as compareCoordinates } from './_compareCoordinates'

export { default as isCoordinateBefore } from './_isCoordinateBefore'

export { default as getContainerRoot } from './_getContainerRoot'

export { default as getContainerPosition } from './_getContainerPosition'

// TODO: we could optimize this by 'compiling' which properties are 'parent' props
// i.e. TEXT, CHILD, and CHILDREN
export function getChildren (node) {
  const doc = node.getDocument()
  const id = node.id
  const schema = node.getSchema()
  let result = []
  for (const p of schema) {
    const name = p.name
    if (p.isText()) {
      const annos = doc.getAnnotations([id, name])
      forEach(annos, a => result.push(a))
    } else if (p.isReference() && p.isOwned()) {
      const val = node.get(name)
      if (val) {
        if (p.isArray()) {
          result = result.concat(val.map(id => doc.get(id)))
        } else {
          result.push(doc.get(val))
        }
      }
    }
  }
  return result
}

export function getParent (node) {
  // TODO: maybe we should implement ParentNodeHook for annotations
  if (node._isAnnotation) {
    const anno = node
    const nodeId = anno.start.path[0]
    return anno.getDocument().get(nodeId)
  } else {
    return node.getParent()
  }
}

/**
 * Create a node from JSON.
 *
 * The given JSON allows to initalize children with nested records.
 * Every record must have 'type' and all required fields set.
 *
 * @param {Document} doc
 * @param {object} data a JSON object
 *
 * @example
 * ```
 * documentHelpers.createNodeFromJson(doc, {
 *    "type": "journal-article-ref",
 *    "title": "VivosX, a disulfide crosslinking method to capture site-specific, protein-protein interactions in yeast and human cells",
 *    "containerTitle": "eLife",
 *    "volume": "7",
 *    "doi": "10.7554/eLife.36654",
 *    "year": "2018",
 *    "month": "08",
 *    "day": "09",
 *    "uri": "https://elifesciences.org/articles/36654",
 *    "authors": [
 *      {
 *       "type": "ref-contrib",
 *       "name": "Mohan",
 *       "givenNames": "Chitra"
 *      }
 *    ],
 * })
 * ```
 */
export function createNodeFromJson (doc, data) {
  if (!data) throw new Error("'data' is mandatory")
  if (!data.type) throw new Error("'data.type' is mandatory")
  if (!isFunction(doc.create)) throw new Error('First argument must be document or tx')
  const type = data.type
  const nodeSchema = doc.getSchema().getNodeSchema(type)
  const nodeData = {
    type,
    id: data.id
  }
  for (const p of nodeSchema) {
    const name = p.name
    if (!hasOwnProperty(data, name)) continue
    const val = data[name]
    if (p.isReference()) {
      if (p.isArray()) {
        nodeData[name] = val.map(childData => createNodeFromJson(doc, childData).id)
      } else {
        const child = createNodeFromJson(doc, val)
        nodeData[name] = child.id
      }
    } else {
      nodeData[p.name] = val
    }
  }
  return doc.create(nodeData)
}

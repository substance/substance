import ArrayIterator from '../util/ArrayIterator'
import last from '../util/last'
import createCountingIdGenerator from '../util/createCountingIdGenerator'

const WS_LEFT = /^\s+/g
// TODO: this is probably incorrect, /^\s*/ would always be a match
// const WS_LEFT_ALL = /^\s*/g
const WS_RIGHT = /\s+$/g
const WS_ALL = /\s+/g
// var ALL_WS_NOTSPACE_LEFT = /^[\t\n]+/g
// var ALL_WS_NOTSPACE_RIGHT = /[\t\n]+$/g
const SPACE = ' '
const TABS_OR_NL = /[\t\n\r]+/g

const INVISIBLE_CHARACTER = '\u200B'

/**
 * A generic base implementation for XML/HTML importers.
 *
 * @param {Document} config.document an empty document instance used to import into
 * @param {object[]} config.converters a list of converters
 */
export default class DOMImporter {
  constructor (config, context) {
    this.context = context || {}

    if (!config.schema) {
      throw new Error('"config.schema" is mandatory')
    }
    if (!config.converters) {
      throw new Error('"config.converters" is mandatory')
    }

    this.config = Object.assign({ idAttribute: 'id' }, config)
    this.schema = config.schema
    this.converters = config.converters
    this.state = null

    this._defaultBlockConverter = null
    this._allConverters = []
    this._blockConverters = []
    this._propertyAnnotationConverters = []

    this.state = new DOMImporter.State()

    this._initialize()
  }

  /*
    Goes through all converters, checks their consistency
    and registers them depending on the type in different sets.
  */
  _initialize () {
    const schema = this.schema
    const defaultTextType = schema.getDefaultTextType()
    const converters = this.converters
    for (let i = 0; i < converters.length; i++) {
      let converter
      if (typeof converters[i] === 'function') {
        const Converter = converters[i]
        converter = new Converter()
      } else {
        converter = converters[i]
      }
      if (!converter.type) {
        throw new Error('Converter must provide the type of the associated node.')
      }
      if (!converter.matchElement && !converter.tagName) {
        throw new Error('Converter must provide a matchElement function or a tagName property.')
      }
      if (!converter.matchElement) {
        converter.matchElement = this._defaultElementMatcher.bind(converter)
      }
      const NodeClass = schema.getNodeClass(converter.type)
      if (!NodeClass) {
        throw new Error('No node type defined for converter')
      }
      if (!this._defaultBlockConverter && defaultTextType === converter.type) {
        this._defaultBlockConverter = converter
      }
      this._allConverters.push(converter)
      // Defaults to _blockConverters
      // TODO: rename '_propertyAnnotationConverters' to 'inlineElementConverters'
      // TODO: what about anchors and ContainerAnnotations?
      if (NodeClass.isPropertyAnnotation() || NodeClass.isInlineNode()) {
        this._propertyAnnotationConverters.push(converter)
      } else {
        this._blockConverters.push(converter)
      }
    }
  }

  dispose () {
    if (this.state.doc) {
      this.state.doc.dispose()
    }
  }

  /**
   * Resets this importer.
   *
   * Make sure to either create a new importer instance or call this method
   * when you want to generate nodes belonging to different documents.
   */
  reset () {
    if (this.state.doc) {
      this.state.doc.dispose()
    }
    this.state.reset()
    this.state.doc = this._createDocument()
  }

  getDocument () {
    return this.state.doc
  }

  /**
   * Converts all children of a given element and creates a Container node.
   *
   * @param {DOMElement[]} elements All elements that should be converted into the container.
   * @param {String} containerId The id of the target container node.
   * @returns {Container} the container node
   */
  convertContainer (elements, containerId) {
    if (!this.state.doc) this.reset()
    const state = this.state
    const iterator = new ArrayIterator(elements)
    const nodeIds = []
    while (iterator.hasNext()) {
      const el = iterator.next()
      let node
      const blockTypeConverter = this._getConverterForElement(el, 'block')
      if (blockTypeConverter) {
        state.pushContext(el.tagName, blockTypeConverter)
        let nodeData = this._createNodeData(el, blockTypeConverter.type)
        nodeData = blockTypeConverter.import(el, nodeData, this) || nodeData
        node = this._createNode(nodeData)
        let context = state.popContext()
        context.annos.forEach((a) => {
          this._createNode(a)
        })
      } else if (el.isCommentNode()) {
        continue
      } else {
        // skip empty text nodes
        if (el.isTextNode() && /^\s*$/.exec(el.textContent)) continue
        // If we find text nodes on the block level we wrap
        // it into a paragraph element (or what is configured as default block level element)
        iterator.back()
        node = this._wrapInlineElementsIntoBlockElement(iterator)
      }
      if (node) {
        nodeIds.push(node.id)
      }
    }
    return this._createNode({
      type: '@container',
      id: containerId,
      nodes: nodeIds
    })
  }

  /**
   * Converts a single HTML element and creates a node in the current document.
   *
   * @param {ui/DOMElement} el the HTML element
   * @returns {object} the created node as JSON
   */
  convertElement (el) {
    if (!this.state.doc) this.reset()
    let isTopLevel = !this.state.isConverting
    if (isTopLevel) {
      this.state.isConverting = true
    }

    let nodeData, annos
    const converter = this._getConverterForElement(el)
    if (converter) {
      const NodeClass = this.schema.getNodeClass(converter.type)
      nodeData = this._createNodeData(el, converter.type)
      this.state.pushContext(el.tagName, converter)
      // Note: special treatment for property annotations and inline nodes
      // i.e. if someone calls `importer.convertElement(annoEl)`
      // usually, annotations are imported via `importer.annotatedText(..)`
      // The peculiarity here is that in such a case, it is not
      // not clear, which property the annotation should be attached to.
      if (NodeClass.isInlineNode()) {
        nodeData = this._convertInlineNode(el, nodeData, converter)
      } else if (NodeClass.isPropertyAnnotation()) {
        nodeData = this._convertPropertyAnnotation(el, nodeData)
      } else {
        nodeData = converter.import(el, nodeData, this) || nodeData
      }
      let context = this.state.popContext()
      annos = context.annos
    } else {
      throw new Error('No converter found for ' + el.tagName)
    }
    // create the node
    const node = this._createNode(nodeData)
    // and all annos which have been created during this call
    annos.forEach((a) => {
      this._createNode(a)
    })

    // HACK: to allow using an importer stand-alone
    // i.e. creating detached elements
    if (this.config['stand-alone'] && isTopLevel) {
      this.state.isConverting = false
      this.reset()
    }
    return node
  }

  /**
   * Convert annotated text. You should call this method only for elements
   * containing rich-text.
   *
   * @param {DOMElement} el
   * @param {String[]} path The target property where the extracted text (plus annotations) should be stored.
   * @param {Object} options
   * @param {Boolean} options.preserveWhitespace when true will preserve whitespace. Default: false.
   * @returns {String} The converted text as plain-text
   *
   * @example
   *
   * ```
   * p.content = converter.annotatedText(pEl, [p.id, 'content'])
   * ```
   */
  annotatedText (el, path, options = {}) {
    if (!path) {
      throw new Error('path is mandatory')
    }
    const state = this.state
    const context = last(state.contexts)
    // NOTE: this API is meant for node converters, which have been triggered
    // via convertElement().
    if (!context) {
      throw new Error('This should be called from within an element converter.')
    }
    // TODO: are there more options?
    const oldPreserveWhitespace = state.preserveWhitespace
    if (options.preserveWhitespace) {
      state.preserveWhitespace = true
    }
    state.stack.push({ path: path, offset: 0, text: '', annos: [] })
    // IMO we should reset the last char, as it is only relevant within one
    // annotated text property. This feature is mainly used to eat up
    // whitespace in XML/HTML at tag boundaries, produced by pretty-printed XML/HTML.
    this.state.lastChar = ''
    const iterator = this.getChildNodeIterator(el)
    const text = this._annotatedText(iterator)
    // now we can create all annotations which have been created during this
    // call of annotatedText
    const top = state.stack.pop()
    context.annos = context.annos.concat(top.annos)

    // reset state
    state.preserveWhitespace = oldPreserveWhitespace

    return text
  }

  /**
   * Converts the given element as plain-text.
   *
   * @param {ui/DOMElement} el
   * @returns {String} The plain text
   */
  plainText (el) {
    var state = this.state
    var text = el.textContent
    if (state.stack.length > 0) {
      var context = last(state.stack)
      context.offset += text.length
      context.text += context.text.concat(text)
    }
    return text
  }

  /**
   * Tells the converter to insert custom text.
   *
   * During conversion of annotatedText this is used to insert different
   * text than taken from the DOM. E.g., for inline nodes we insert an invisible
   * character instead of the inner content.
   *
   * @private
   * @param {String}
   */
  _customText (text) {
    var state = this.state
    if (state.stack.length > 0) {
      var context = last(state.stack)
      context.offset += text.length
      context.text += context.text.concat(text)
    }
    return text
  }

  /**
   * Generates an id. The generated id is unique with respect to all ids generated so far.
   *
   * @param {String} prefix
   * @return {String} the generated id
   */
  nextId (prefix) {
    // TODO: we could create more beautiful ids?
    // however we would need to be careful as there might be another
    // element in the HTML coming with that id
    // For now we use shas
    return this.state.uuid(prefix)
  }

  _getNextId (dom, type) {
    let id = this.nextId(type)
    while (this.state.ids[id] || dom.find('#' + id)) {
      id = this.nextId(type)
    }
    return id
  }

  _getIdForElement (el, type) {
    let id = el.getAttribute(this.config.idAttribute)
    if (id && !this.state.ids[id]) return id
    return this._getNextId(el.getOwnerDocument(), type)
  }

  // Note: this is e.g. shared by ClipboardImporter which has a different
  // implementation of this.createDocument()
  _createDocument () {
    // create an empty document and initialize the container if not present
    const schema = this.config.schema
    const DocumentClass = schema.getDocumentClass()
    return new DocumentClass(schema)
  }

  _convertPropertyAnnotation (el, nodeData) {
    const path = [nodeData.id, '_content']
    // if there is no context, this is called stand-alone
    // i.e., user tries to convert an annotation element
    // directly, not part of a block element, such as a paragraph
    nodeData._content = this.annotatedText(el, path)
    nodeData.start = { path, offset: 0 }
    nodeData.end = { offset: nodeData._content.length }
    return nodeData
  }

  _convertInlineNode (el, nodeData, converter) {
    const path = [nodeData.id, '_content']
    if (converter.import) {
      nodeData = converter.import(el, nodeData, this) || nodeData
    }
    nodeData._content = '$'
    nodeData.start = { path, offset: 0 }
    nodeData.end = { offset: 1 }
    return nodeData
  }

  _createNodeData (el, type) {
    if (!type) {
      throw new Error('type is mandatory.')
    }
    let nodeData = {
      type,
      id: this._getIdForElement(el, type)
    }
    this.state.ids[nodeData.id] = true
    return nodeData
  }

  _createNode (nodeData) {
    let doc = this.state.doc
    // NOTE: if your Document implementation adds default nodes in the constructor
    // and you have exported the node, we need to remove the default version first
    // TODO: alternatively we could just update the existing one. For now we remove the old one.
    let node = doc.get(nodeData.id)
    if (node) {
      // console.warn('Node with same it already exists.', node)
      doc.delete(node.id)
    }
    return doc.create(nodeData)
  }

  getChildNodeIterator (el) {
    return el.getChildNodeIterator()
  }

  _defaultElementMatcher (el) {
    return el.is(this.tagName)
  }

  /**
   * Internal function for parsing annotated text
   */
  _annotatedText (iterator) {
    const state = this.state
    const context = last(state.stack)
    /* istanbul ignore next */
    if (!context) {
      throw new Error('Illegal state: context is null.')
    }
    while (iterator.hasNext()) {
      var el = iterator.next()
      var text = ''
      /* istanbul ignore else */
      // Plain text nodes...
      if (el.isTextNode()) {
        text = this._prepareText(el.textContent)
        if (text.length) {
          // Note: text is not merged into the reentrant state
          // so that we are able to return for this reentrant call
          context.text = context.text.concat(text)
          context.offset += text.length
        }
      } else if (el.isCommentNode()) {
        // skip comment nodes
        continue
      } else if (el.isElementNode()) {
        const annoConverter = this._getConverterForElement(el, 'inline')
        // if no inline converter is found we just traverse deeper
        if (!annoConverter) {
          /* istanbul ignore next */
          if (!this.IGNORE_DEFAULT_WARNINGS) {
            console.warn('Unsupported inline element. We will not create an annotation for it, but process its children to extract annotated text.', el.outerHTML)
          }
          // this descends into children elements without introducing a new stack frame
          // and without creating an element.
          const iterator = this.getChildNodeIterator(el)
          this._annotatedText(iterator)
          continue
        }
        // reentrant: we delegate the conversion to the inline node class
        // it will either call us back (this.annotatedText) or give us a finished
        // node instantly (self-managed)
        var startOffset = context.offset
        const annoType = annoConverter.type
        const AnnoClass = this.schema.getNodeClass(annoType)
        if (!AnnoClass) {
          throw new Error(`No Node class registered for type ${annoType}.`)
        }
        let annoData = this._createNodeData(el, annoType)
        // push a new context so we can deal with reentrant calls
        let stackFrame = {
          path: context.path,
          offset: startOffset,
          text: '',
          annos: []
        }
        state.stack.push(stackFrame)
        // with custom import
        if (annoConverter.import) {
          state.pushContext(el.tagName, annoConverter)
          annoData = annoConverter.import(el, annoData, this) || annoData
          state.popContext()
        }
        // As opposed to earlier implementations we do not rely on
        // let the content be converted by custom implementations
        // as they do not own the content
        // TODO: we should make sure to throw when the user tries to
        if (AnnoClass.isInlineNode()) {
          this._customText(INVISIBLE_CHARACTER)
          // TODO: check if this is correct; after reading an inline,
          // we need to reset the lastChar, so that the next whitespace
          // does not get skipped
          state.lastChar = ''
        } else {
          // We call this to descent into the element
          // which could be 'forgotten' otherwise.
          // TODO: what if the converter has processed the element already?
          const iterator = this.getChildNodeIterator(el)
          this._annotatedText(iterator)
        }
        // ... and transfer the result into the current context
        state.stack.pop()
        context.offset = stackFrame.offset
        context.text = context.text.concat(stackFrame.text)
        // in the mean time the offset will probably have changed to reentrant calls
        const endOffset = context.offset
        annoData.start = {
          path: context.path.slice(0),
          offset: startOffset
        }
        annoData.end = {
          offset: endOffset
        }
        // merge annos into parent stack frame
        let parentFrame = last(state.stack)
        parentFrame.annos = parentFrame.annos.concat(stackFrame.annos, annoData)
      } else {
        console.warn('Unknown element type. Taking plain text.', el.outerHTML)
        text = this._prepareText(el.textContent)
        context.text = context.text.concat(text)
        context.offset += text.length
      }
    }
    // return the plain text collected during this reentrant call
    return context.text
  }

  _getConverterForElement (el, mode) {
    var converters
    if (mode === 'block') {
      if (!el.tagName) return null
      converters = this._blockConverters
    } else if (mode === 'inline') {
      converters = this._propertyAnnotationConverters
    } else {
      converters = this._allConverters
    }
    var converter = null
    for (var i = 0; i < converters.length; i++) {
      if (this._converterCanBeApplied(converters[i], el)) {
        converter = converters[i]
        break
      }
    }
    return converter
  }

  _converterCanBeApplied (converter, el) {
    return converter.matchElement(el, this)
  }

  /**
   * Wraps the remaining (inline) elements of a node iterator into a default
   * block node.
   *
   * @param {DOMImporter.ChildIterator} childIterator
   * @returns {object} node data
   */
  _wrapInlineElementsIntoBlockElement (childIterator) {
    if (!childIterator.hasNext()) return

    const converter = this._defaultBlockConverter
    if (!converter) {
      throw new Error('Wrapping inline elements automatically is not supported in this schema.')
    }

    let dom = childIterator.peek().getOwnerDocument()
    let wrapper = dom.createElement('wrapper')
    while (childIterator.hasNext()) {
      const el = childIterator.next()
      // if there is a block node we finish this wrapper
      const blockTypeConverter = this._getConverterForElement(el, 'block')
      if (blockTypeConverter) {
        childIterator.back()
        break
      }
      wrapper.append(el.clone())
    }
    const type = this.schema.getDefaultTextType()
    const id = this._getNextId(dom, type)
    let nodeData = { type, id }
    this.state.pushContext('wrapper', converter)
    nodeData = converter.import(wrapper, nodeData, this) || nodeData
    let context = this.state.popContext()
    let annos = context.annos
    // create the node
    const node = this._createNode(nodeData)
    // and all annos which have been created during this call
    annos.forEach((a) => {
      this._createNode(a)
    })
    return node
  }

  // TODO: this needs to be tested and documented
  // TODO: after recent work with XML we found that
  // doing white-space handling here is not optimal
  // instead it should be done as a preprocessing step
  _prepareText (text) {
    const state = this.state
    if (state.preserveWhitespace) {
      return text
    }
    var repl = SPACE
    // replace multiple tabs and new-lines by one space
    text = text.replace(TABS_OR_NL, '')
    // TODO: the last char handling is only necessary for for nested calls
    // i.e., when processing the content of an annotation, for instance
    // we need to work out how we could control this with an inner state
    // TODO: this is incorrect: replacing /\s*/ will insert a space
    // even if there is not one present
    if (state.lastChar === SPACE) {
      // replace any double space, even if it is across element boundary
      text = text.replace(WS_LEFT, '')
    } else {
      text = text.replace(WS_LEFT, repl)
    }
    text = text.replace(WS_RIGHT, repl)
    // EXPERIMENTAL: also remove white-space within
    // this happens if somebody treats the text more like it would be done in Markdown
    // i.e. introducing line-breaks
    if (this.config.REMOVE_INNER_WS || state.removeInnerWhitespace) {
      text = text.replace(WS_ALL, SPACE)
    }
    state.lastChar = text[text.length - 1] || state.lastChar
    return text
  }

  /**
   * Removes any leading and trailing whitespaces from the content
   * within the given element.
   * Attention: this is not yet implemented fully. Atm, trimming is only done
   * on the first and last text node (if they exist).
   */
  _trimTextContent (el) {
    var nodes = el.getChildNodes()
    var firstNode = nodes[0]
    var lastNode = last(nodes)
    var text, trimmed
    // trim the first and last text
    if (firstNode && firstNode.isTextNode()) {
      text = firstNode.textContent
      trimmed = this._trimLeft(text)
      firstNode.textContent = trimmed
    }
    if (lastNode && lastNode.isTextNode()) {
      text = lastNode.textContent
      trimmed = this._trimRight(text)
      lastNode.textContent = trimmed
    }
    return el
  }

  _trimLeft (text) {
    return text.replace(WS_LEFT, '')
  }

  _trimRight (text) {
    return text.replace(WS_RIGHT, '')
  }
}

class DOMImporterState {
  constructor () {
    this.reset()
  }

  reset () {
    this.preserveWhitespace = false
    this.nodes = []
    this.annotations = []
    this.containerPath = null
    this.container = []
    this.ids = {}
    // stack for reentrant calls into convertElement()
    this.contexts = []
    // stack for reentrant calls into annotatedText()
    this.stack = []
    this.lastChar = ''
    this.skipTypes = {}
    this.ignoreAnnotations = false
    this.isConverting = false

    // experimental: trying to generate simpler ids during import
    // this.uuid = uuid
    this.uuid = createCountingIdGenerator()
  }

  pushContext (tagName, converter) {
    this.contexts.push({ tagName, converter, annos: [] })
  }

  popContext () {
    return this.contexts.pop()
  }

  getCurrentContext () {
    return last(this.contexts)
  }
}

DOMImporter.State = DOMImporterState

DOMImporter.INVISIBLE_CHARACTER = INVISIBLE_CHARACTER

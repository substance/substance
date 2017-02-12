import includes from '../../util/includes'
import forEach from '../../util/forEach'
import EventEmitter from '../../util/EventEmitter'

/*
  Manages a table of content for a container. Default implementation considers
  all headings as TOC entries. You can extend this implementation and override
  `computeEntries`. Instantiate this class on controller level and pass it to relevant components
  (such as {@link ui/TOCPanel} and {@link ui/ScrollPane}).

  @class TOCProvider
  @component

  @prop {Controller}
 */

class TOCProvider extends EventEmitter {
  constructor(document, config) {
    super(document, config)
    this.document = document
    this.config = config

    this.entries = this.computeEntries()
    if (this.entries.length > 0) {
      this.activeEntry = this.entries[0].id
    } else {
      this.activeEntry = null
    }

    this.document.on('document:changed', this.handleDocumentChange, this)
  }

  dispose() {
    let doc = this.getDocument()
    doc.disconnect(this)
  }

  // Inspects a document change and recomputes the
  // entries if necessary
  handleDocumentChange(change) {
    let doc = this.getDocument()
    let needsUpdate = false
    let tocTypes = this.constructor.tocTypes

    // HACK: this is not totally correct but works.
    // Actually, the TOC should be updated if tocType nodes
    // get inserted or removed from the container, plus any property changes
    // This implementation just checks for changes of the node type
    // not the container, but as we usually create and show in
    // a single transaction this works.
    for (let i = 0; i < change.ops.length; i++) {
      let op = change.ops[i]
      let nodeType
      if (op.isCreate() || op.isDelete()) {
        let nodeData = op.getValue()
        nodeType = nodeData.type
        if (includes(tocTypes, nodeType)) {
          needsUpdate = true
          break
        }
      } else {
        let id = op.path[0]
        let node = doc.get(id)
        if (node && includes(tocTypes, node.type)) {
          needsUpdate = true
          break
        }
      }
    }
    if (needsUpdate) {
      this.entries = this.computeEntries()
      this.emit('toc:updated')
    }
  }

  computeEntries() {
    let doc = this.getDocument()
    let config = this.config
    let entries = []
    let contentNodes = doc.get(config.containerId).nodes
    forEach(contentNodes, function(nodeId) {
      let node = doc.get(nodeId)
      if (node.type === 'heading') {
        entries.push({
          id: node.id,
          name: node.content,
          level: node.level,
          node: node
        })
      }
    })
    return entries
  }

  getEntries() {
    return this.entries
  }

  getDocument() {
    return this.document
  }

  markActiveEntry(scrollPane) {
    let panelContent = scrollPane.getContentElement()
    let contentHeight = scrollPane.getContentHeight()
    let scrollPaneHeight = scrollPane.getHeight()
    let scrollPos = scrollPane.getScrollPosition()

    let scrollBottom = scrollPos + scrollPaneHeight
    let regularScanline = scrollPos
    let smartScanline = 2 * scrollBottom - contentHeight
    let scanline = Math.max(regularScanline, smartScanline)

    let tocNodes = this.computeEntries()
    if (tocNodes.length === 0) return

    // Use first toc node as default
    let activeEntry = tocNodes[0].id
    for (let i = tocNodes.length - 1; i >= 0; i--) {
      let tocNode = tocNodes[i]
      let nodeEl = panelContent.find('[data-id="'+tocNode.id+'"]')
      if (!nodeEl) {
        console.warn('Not found in Content panel', tocNode.id)
        return
      }
      let panelOffset = scrollPane.getPanelOffsetForElement(nodeEl)
      if (scanline >= panelOffset) {
        activeEntry = tocNode.id
        break
      }
    }

    if (this.activeEntry !== activeEntry) {
      this.activeEntry = activeEntry
      this.emit('toc:updated')
    }
  }
}

TOCProvider.tocTypes = ['heading']

export default TOCProvider

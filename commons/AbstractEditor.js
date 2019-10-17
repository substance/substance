import { Component, domHelpers } from '../dom'
import { platform, getRelativeRect, getSelectionRect } from '../util'
import { EditorSession, createEditorContext } from '../editor'

export default class AbstractEditor extends Component {
  constructor (...args) {
    super(...args)

    this._initialize(this.props)

    this.handleActions({
      executeCommand: this._executeCommand,
      scrollSelectionIntoView: this._scrollSelectionIntoView
    })
  }

  _createAPI (archive, editorSession) {
    throw new Error('This method is abstract')
  }

  _getDocument (archive) {
    throw new Error('This method is abstract')
  }

  _getScrollableElement () {
    throw new Error('This method is abstract')
  }

  _initialize (props) {
    const { archive } = props
    const config = archive.getConfig()
    const document = this._getDocumentFromArchive(archive)
    this.document = document

    const editorSession = new EditorSession('document', document, config, {
      overlayId: null
    })
    this.editorSession = editorSession

    const appState = editorSession.editorState
    this.appState = appState

    const api = this._createAPI(archive, editorSession)
    this.api = api

    const context = Object.assign(this.context, createEditorContext(config, editorSession), {
      config,
      api,
      editorSession,
      editorState: appState,
      archive,
      urlResolver: archive,
      editable: true
    })
    this.context = context

    editorSession.setContext(context)
    editorSession.initialize()

    // HACK: resetting the app state here, because things might get 'dirty' during initialization
    // TODO: find out if there is a better way to do this
    appState._reset()
  }

  willReceiveProps (props) {
    if (props.archive !== this.props.archive) {
      this._dispose()
      this._initialize(props)
      this.empty()
    }
  }

  didMount () {
    this.editorSession.setRootComponent(this)
  }

  dispose () {
    this._dispose()
  }

  handleKeydown (e) {
    let handled = false
    if (!handled) {
      handled = this.editorSession.keyboardManager.onKeydown(e, this.context)
    }
    if (handled) {
      domHelpers.stopAndPrevent(e)
    }
    return handled
  }

  _dispose () {
    this.editorSession.dispose()
  }

  _getDocumentType () {}

  _getDocumentFromArchive (archive) {
    const documentType = this._getDocumentType()
    let documentEntry
    if (!documentType) {
      documentEntry = archive.getDocumentEntries()[0]
    } else {
      documentEntry = archive.getDocumentEntries().find(entry => entry.type === documentType)
    }
    if (documentEntry) {
      return archive.getDocument(documentEntry.id)
    } else {
      throw new Error(`Could not find main document.`)
    }
  }

  _executeCommand (...args) {
    return this.editorSession.commandManager.executeCommand(...args)
  }

  _scrollSelectionIntoView (sel) {
    this._scrollRectIntoView(this._getSelectionRect(sel))
  }

  _scrollRectIntoView (rect) {
    if (!rect) return
    const scrollable = this._getScrollableElement()
    const height = scrollable.getHeight()
    const scrollTop = scrollable.getProperty('scrollTop')
    const upperBound = scrollTop
    const lowerBound = upperBound + height
    const selTop = rect.top + scrollTop
    const selBottom = selTop + rect.height
    // console.log('upperBound', upperBound, 'lowerBound', lowerBound, 'height', height, 'selTop', selTop, 'selBottom', selBottom)
    // TODO: the naming is very confusing cause of the Y-flip of values
    if (selTop < upperBound || selBottom > lowerBound) {
      scrollable.setProperty('scrollTop', selTop)
    }
  }

  _getSelectionRect (sel) {
    let selectionRect
    if (platform.inBrowser && sel && !sel.isNull()) {
      // TODO: here we should use the editor content, i.e. without TOC, or Toolbar
      const contentEl = this._getScrollableElement()
      const contentRect = contentEl.getNativeElement().getBoundingClientRect()
      if (sel.isNodeSelection()) {
        const nodeId = sel.nodeId
        const nodeEl = contentEl.find(`*[data-id="${nodeId}"]`)
        if (nodeEl) {
          const nodeRect = nodeEl.getNativeElement().getBoundingClientRect()
          selectionRect = getRelativeRect(contentRect, nodeRect)
        } else {
          console.error(`FIXME: could not find a node with data-id=${nodeId}`)
        }
      } else {
        selectionRect = getSelectionRect(contentRect)
      }
    }
    return selectionRect
  }
}

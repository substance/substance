import DefaultDOMElement from './DefaultDOMElement'
import Component from './Component'

class DragManager {

  constructor(dndHandlers, context) {
    this.context = context
    this.dndHandlers = dndHandlers
    this._source = null
  }

  dispose() {
    let documentEl = DefaultDOMElement.wrapNativeElement(window.document)
    documentEl.off(this)
  }

  onDragStart(event, component) { // eslint-disable-line
    // dito: trigger listeners to expose drop targets
    // console.log('DragManager.onDragStart', event, component);
    event.dataTransfer.effectAllowed = 'all'
    event.dataTransfer.setData('text/html', event.target.outerHTML)
    event.stopPropagation()

    this._source = component
    let data = {
      source: component,
      event: event
    }
    for (let i = 0; i < this.dndHandlers.length; i++) {
      let handler = this.dndHandlers[i]
      handler.dragStart(data, this.context)
    }
  }

  onDragEnter(event, component) { // eslint-disable-line
    // we could emit an event, so that listeners could expose drop targets
    // console.log('DragManager.onDragEnter', event, component);
    event.stopPropagation()
  }

  onDragOver(event, component) { // eslint-disable-line
    // prevent default to allow drop
    // console.log('DragManager.onDragOver', event, component);
    event.preventDefault()
    event.stopPropagation()
  }

  onDrop(event, component) {
    // console.log('DragManager.onDrop', event, component);
    event.preventDefault()
    event.stopPropagation()
    let source = this._source
    this._source = null
    let params = {
      event: event,
      source: source,
      target: _getTargetInfo(event, component),
      data: _getData(event)
    }

    let i, handler;
    for (i = 0; i < this.dndHandlers.length; i++) {
      handler = this.dndHandlers[i]
      let _break = handler.drop(params, this.context)
      if (_break) break
    }
    for (i = 0; i < this.dndHandlers.length; i++) {
      handler = this.dndHandlers[i]
      handler.dragEnd(params, this.context)
    }
  }

  _getData(event) {
    let dataTransfer = event.dataTransfer
    if (dataTransfer) {
      return {
        types: dataTransfer.types,
        items: Array.prototype.slice.call(dataTransfer.items),
        files: Array.prototype.slice.call(dataTransfer.files)
      }
    }
  }
}

function _getData(event) {
  let dataTransfer = event.dataTransfer
  if (dataTransfer) {
    return {
      types: dataTransfer.types,
      items: Array.prototype.slice.call(dataTransfer.items),
      files: Array.prototype.slice.call(dataTransfer.files)
    }
  }
}

function _getTargetInfo(event) {
  let target = {
    element: DefaultDOMElement.wrapNativeElement(event.target)
  }
  // try to get information about the component
  let comp = Component.getComponentFromNativeElement(event.target)
  comp = _getComponent(comp)
  if (comp) {
    target.comp = comp
    if (target._isSurface) {
      target.surface = comp
    } else if (comp.context.surface) {
      target.surface = comp.context.surface
    }
    if (target.surface) {
      let sel = target.surface.getSelectionFromEvent(event)
      if (sel) target.selection = sel
    }
    let node = comp.props.node
    if (node) target.node = node
    if (comp._isTextPropertyComponent) {
      target.path = comp.props.path
    }
  }
  return target
}

function _getComponent(comp) {
  if (comp._isTextNodeComponent || comp._isElementComponent) {
    return _getComponent(comp.getParent())
  }
  return comp;
}

export default DragManager

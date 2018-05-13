import Component from './Component'

export default class CustomSurface extends Component {

  constructor(...args) {
    super(...args)

    this._name = this._getCustomResourceId()
    this._surfaceId = this._createSurfaceId()
  }

  getChildContext() {
    return {
      surface: this,
      parentSurfaceId: this.getId()
      // HACK: clearing isolatedNodeComponent so that we can easily know
      // if this surface is within an isolated node
      // isolatedNodeComponent: null
    }
  }


  didMount() {
    const surfaceManager = this.context.editorSession.surfaceManager
    surfaceManager.registerSurface(this)
  }

  dispose() {
    const surfaceManager = this.context.editorSession.surfaceManager
    surfaceManager.unregisterSurface(this)
  }

  rerenderDOMSelection() {
    // nothing by default
  }

  get name() {
    return this._name
  }

  getId() {
    return this._surfaceId
  }

  getContainer() {
    return undefined
  }

  getContainerId() {
    return undefined
  }

  isContainerEditor() {
    return false
  }

  isCustomEditor() {
    return true
  }

  isDisabled() {
    return Boolean(this.props.disabled)
  }

  _focus() {
    // nothing by default
  }

  _createSurfaceId() {
    let isolatedNodeComponent = this.context.isolatedNodeComponent
    if (isolatedNodeComponent) {
      let parentSurface = isolatedNodeComponent.context.surface
      return parentSurface.id + '/' + isolatedNodeComponent.props.node.id + '/' + this._name
    } else {
      return this._name
    }
  }

  _getCustomResourceId() {
    throw new Error('This method needs to be implemented by a CustomSurface')
  }

}
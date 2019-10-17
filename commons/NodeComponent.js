import { Component } from '../dom'

export default class NodeComponent extends Component {
  didMount () {
    const node = this._getNode()

    this.context.editorState.addObserver(['document'], this._onNodeUpdate, this, { document: { path: [node.id] }, stage: 'render' })
  }

  dispose () {
    super.dispose()

    this.context.editorState.off(this)
  }

  _getNode () {
    return this.props.node
  }

  _onNodeUpdate () {
    this.rerender()
  }
}

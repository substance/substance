import { Component } from '../dom'

export default class PropertyComponent extends Component {
  didMount () {
    const path = this.getPath()
    this.context.editorState.addObserver(['document'], this.rerender, this, {
      document: {
        path
      },
      stage: 'render'
    })
  }

  dispose () {
    this.context.editorState.off(this)
  }

  getPath () {
    throw new Error('Not implemented.')
  }
}

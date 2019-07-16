import { TextNodeComponent } from 'substance'

export default class HeadingComponent extends TextNodeComponent {
  didMount () {
    this.context.editorSession.getEditorState().addObserver(['document'], this.rerender, this, {
      stage: 'render',
      document: { path: [this.props.node.id] }
    })
  }

  dispose () {
    this.context.editorSession.getEditorState().removeObserver(this)
  }

  getClassNames () {
    return 'sc-heading sc-text-node'
  }

  getTagName () {
    return 'h' + this.props.node.level
  }
}

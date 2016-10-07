import NodeComponent from './NodeComponent'
import TextProperty from './TextPropertyComponent'

class TextBlockComponent extends NodeComponent {

  render($$) {
    let el = super.render.call(this, $$);
    el.append($$(TextProperty, {
      path: [ this.props.node.id, "content"]
    }))
    return el
  }

}

export default TextBlockComponent

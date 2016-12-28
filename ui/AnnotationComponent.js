import Component from './Component'

/**
  Renders an annotation. Used internally by different components (e.g. ui/AnnotatedTextComponent)

  @class
  @component
  @extends ui/Component

  @prop {Object} doc document
  @prop {Object} node node which describes annotation

  @example

  ```js
  $$(AnnotationComponent, {
    doc: doc,
    node: node
  })
  ```
*/

class AnnotationComponent extends Component {

  // TODO: we should avoid to have a didMount hook on an abstract base class
  didMount() {
    let node = this.props.node
    node.on('highlighted', this.onHighlightedChanged, this)
  }

  // TODO: we should avoid to have a didMount hook on an abstract base class
  dispose() {
    let node = this.props.node
    node.off(this)
  }

  render($$) {
    let el = $$(this.getTagName())
      .attr("data-id", this.props.node.id)
      .addClass(this.getClassNames())
    if (this.props.node.highlighted) {
      el.addClass('sm-highlighted')
    }
    el.append(this.props.children)
    return el
  }

  getClassNames() {
    return 'sc-'+this.props.node.type
  }

  onHighlightedChanged() {
    if (this.props.node.highlighted) {
      this.el.addClass('sm-highlighted')
    } else {
      this.el.removeClass('sm-highlighted')
    }
  }

  getTagName() {
    return 'span'
  }

}

export default AnnotationComponent

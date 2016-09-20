import AnnotationComponent from '../../ui/AnnotationComponent'

class LinkComponent extends AnnotationComponent {

  didMount() {
    super.didMount.apply(this, arguments)

    var node = this.props.node
    node.on('properties:changed', this.rerender, this)
  }

  dispose() {
    super.dispose.apply(this, arguments)

    var node = this.props.node
    node.off(this)
  }

  render($$) { // eslint-disable-line
    var el = super.render.apply(this, arguments)

    el.tagName = 'a';
    el.attr('href', this.props.node.url)

    var titleComps = [this.props.node.url]
    if (this.props.node.title) {
      titleComps.push(this.props.node.title)
    }

    return el.attr("title", titleComps.join(' | '))
  }

}

export default LinkComponent

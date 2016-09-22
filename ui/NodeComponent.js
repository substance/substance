import Component from './Component'

class NodeComponent extends Component {

  render($$) {
    let tagName = this.getTagName()
    let el = $$(tagName)
      .attr('data-id', this.props.node.id)
      .addClass(this.getClassNames())
    return el
  }

  getTagName() {
    return 'div'
  }

  getClassNames() {
    return ''
  }

}

export default NodeComponent

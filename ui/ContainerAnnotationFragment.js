import Component from './Component'

class ContainerAnnotationFragment extends Component {

  render($$) {
    let fragment = this.props.node
    let el = $$('span')
      .attr("data-id", fragment.id)
      .addClass('sc-'+fragment.anno.type)
    el.append(this.props.children)
    return el
  }

}

export default ContainerAnnotationFragment

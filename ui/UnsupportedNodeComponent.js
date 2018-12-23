import Component from './Component'

export default class UnsupportedNodeComponent extends Component {
  render ($$) {
    let model = this.props.model
    return $$('pre')
      .addClass('content-node unsupported')
      .attr({
        'data-id': model.id,
        contentEditable: false
      })
      .append(
        JSON.stringify(model.properties, null, 2)
      )
  }
}

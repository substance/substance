import Component from '../../ui/Component'
import TextPropertyEditor from '../../ui/TextPropertyEditor'

class TableCellComponent extends Component {
  render($$) {
    let node = this.props.node
    let el = $$('td').addClass('sc-table-cell')
    el.append(
      $$(TextPropertyEditor, {
        path: node.getTextPath(),
        disabled: this.props.disabled
      }).ref('editor')
    )
    if (node.rowspan > 0) {
      el.attr('rowspan', node.rowspan)
    }
    if (node.colspan > 0) {
      el.attr('colspan', node.colspan)
    }
    return el
  }
}


export default TableCellComponent

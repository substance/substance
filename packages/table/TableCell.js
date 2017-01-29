import TextNode from '../../model/TextNode'

class TableCell extends TextNode {}

TableCell.schema = {
  type: 'table-cell',
  rowspan: { type: 'number', default: 0 },
  colspan: { type: 'number', default: 0 }
}

export default TableCell
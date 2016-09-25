import Component from '../../ui/Component'
import CustomSelection from '../../model/CustomSelection'
import DefaultDOMElement from '../../ui/DefaultDOMElement'
import tableHelpers from './tableHelpers'
import keys from '../../util/keys'
import getRelativeBoundingRect from '../../util/getRelativeBoundingRect'
import TextCellContent from './TextCellContent'

class TableComponent extends Component {
  constructor(...args) {
    super(...args)

    if (this.context.surfaceParent) {
      this.surfaceId = this.context.surfaceParent.getId()
    } else {
      this.surfaceId = this.props.node.id
    }

    this._selectedCells = {}
  }

  didMount() {
    let documentSession = this.getDocumentSession()
    documentSession.on('didUpdate', this.onSessionDidUpdate, this)

    let globalEventHandler = this.context.globalEventHandler
    if (globalEventHandler) {
      globalEventHandler.on('keydown', this.onKeydown, this, { id: this.surfaceId })
    }
  }

  dispose() {
    let documentSession = this.getDocumentSession()
    documentSession.off(this)

    let globalEventHandler = this.context.globalEventHandler
    if (globalEventHandler) {
      globalEventHandler.off(this)
    }
  }

  render($$) {
    let node = this.props.node

    let el = $$('div').addClass('sc-table')

    let tableEl = $$('table')
    let cellEntries = node.cells

    let nrows = node.getRowCount()
    let ncols = node.getColCount()
    let i,j

    let thead = $$('thead').addClass('se-head')
    let colControls = $$('tr').addClass('se-column-controls')
    colControls.append($$('td').addClass('se-corner-tl'))
    colControls.append($$('td').addClass('se-hspace'))
    for (j = 0; j < ncols; j++) {
      colControls.append(
        $$('td').addClass('se-column-handle').attr('data-col', j).ref('col-handle'+j)
          .on('mousedown', this._onColumnHandle)
          .append(tableHelpers.getColumnName(j))
      )
    }
    colControls.append($$('td').addClass('se-hspace'))
    thead.append(colControls)
    thead.append($$('tr').addClass('se-vspace'))

    let tbody = $$('tbody').addClass('se-body').ref('body')
    for (i = 0; i < nrows; i++) {
      let row = cellEntries[i]
      let rowEl = $$('tr').addClass('se-row').attr('data-row', i)

      rowEl.append(
        $$('td').addClass('se-row-handle').attr('data-row', i).ref('row-handle'+i)
          .on('mousedown', this._onRowHandle)
          .append(tableHelpers.getRowName(i))
      );
      rowEl.append($$('td').addClass('se-hspace'))

      console.assert(row.length === ncols, 'row should be complete.')
      for (j = 0; j < ncols; j++) {
        let cellId = row[j]
        let cellEl = this.renderCell($$, cellId)
        cellEl.attr('data-col', j)
          .on('mousedown', this._onCell)
        rowEl.append(cellEl)
      }
      rowEl.append($$('td').addClass('se-hspace'))

      tbody.append(rowEl)
    }

    var tfoot = $$('tfoot').addClass('se-foot')
    tfoot.append($$('tr').addClass('se-vspace'))
    colControls = $$('tr').addClass('se-column-controls')
    colControls.append($$('td').addClass('se-corner-bl'))
    colControls.append($$('td').addClass('se-hspace'))
    for (j = 0; j < ncols; j++) {
      colControls.append($$('td').addClass('se-hspace'))
    }
    colControls.append($$('td').addClass('se-hspace'))
    tfoot.append(colControls)

    tableEl.append(thead)
    tableEl.append(tbody)
    tableEl.append(tfoot)

    el.append(tableEl)

    // selection as an overlay
    el.append(
      $$('div').addClass('se-selection').ref('selection')
        .on('mousedown', this._whenClickingOnSelection)
    )

    return el
  }

  renderCell($$, cellId) {
    let cellEl = $$('td').addClass('se-cell')
    let doc = this.props.node.getDocument()
    let cellContent = doc.get(cellId)
    if (cellContent) {
      // TODO: we need to derive disabled state
      // 1. if table is disabled all cells are disabled
      // 2. if sel is TableSelection then cell is disabled if not in table selection range
      // 3. else cell is disabled if not focused/co-focused
      cellEl.append(
        $$(TextCellContent, {
          disabled: !this._selectedCells[cellId],
          node: cellContent,
        }).ref(cellId)
      )
    }

    return cellEl
  }

  getId() {
    return this.surfaceId
  }

  getDocumentSession() {
    return this.context.documentSession
  }

  getSelection() {
    let documentSession = this.getDocumentSession()
    let sel = documentSession.getSelection()
    if (sel && sel.isCustomSelection() && sel.getCustomType() === 'table' && sel.surfaceId === this.getId()) {
      return sel
    } else {
      return null
    }
  }

  _setSelection(startRow, startCol, endRow, endCol) {
    let documentSession = this.getDocumentSession()
    documentSession.setSelection(new CustomSelection('table', {
      startRow: startRow, startCol: startCol,
      endRow: endRow, endCol: endCol
    }, this.getId()))
  }

  onSessionDidUpdate(update) {
    if (update.selection) {
      let sel = this.getSelection()
      this._selectedCells = {}
      if (sel) {
        let rect = this._getRectangle(sel)
        for(let i=rect.minRow; i<=rect.maxRow; i++) {
          for(let j=rect.minCol; j<=rect.maxCol; j++) {
            let cellId = this.props.node.cells[i][j]
            this._selectedCells[cellId] = true
          }
        }
        this._renderSelection(sel)
      }
    }
  }

  onKeydown(e) {
    let handled = false;
    switch (e.keyCode) {
      case keys.LEFT:
        this._changeSelection(0, -1, e.shiftKey)
        handled = true
        break
      case keys.RIGHT:
        this._changeSelection(0, 1, e.shiftKey)
        handled = true
        break
      case keys.DOWN:
        this._changeSelection(1, 0, e.shiftKey)
        handled = true
        break
      case keys.UP:
        this._changeSelection(-1, 0, e.shiftKey)
        handled = true
        break
      default:
        // nothing
    }
    if (handled) {
      e.preventDefault()
    }
  }

  _onColumnHandle(e) {
    e.stopPropagation()
    e.preventDefault()
    let el = DefaultDOMElement.wrapNativeElement(e.currentTarget)
    let col = parseInt(el.attr('data-col'), 10)
    let rowCount = this.props.node.getRowCount()
    this._setSelection(0, col, rowCount-1, col)
  }

  _onRowHandle(e) {
    e.stopPropagation()
    e.preventDefault()
    let el = DefaultDOMElement.wrapNativeElement(e.currentTarget)
    let row = parseInt(el.attr('data-row'), 10)
    let colCount = this.props.node.getColCount()
    this._setSelection(row, 0, row, colCount-1)
  }

  _onCell(e) {
    e.stopPropagation()
    e.preventDefault()

    let el = DefaultDOMElement.wrapNativeElement(e.currentTarget)
    let col = parseInt(el.attr('data-col'), 10)
    let row = parseInt(el.parentNode.attr('data-row'), 10)

    this._setSelection(row, col, row, col)
  }

  _changeSelection(rowInc, colInc, expand) {
    let sel = this.getSelection()
    if (sel) {
      let maxRow = this.props.node.getRowCount()-1
      let maxCol = this.props.node.getColCount()-1
      if (expand) {
        let endRow = Math.max(0, Math.min(sel.data.endRow + rowInc, maxRow))
        let endCol = Math.max(0, Math.min(sel.data.endCol + colInc, maxCol))
        this._setSelection(sel.data.startRow, sel.data.startCol, endRow, endCol)
      } else {
        let row = Math.max(0, Math.min(sel.data.endRow + rowInc, maxRow))
        let col = Math.max(0, Math.min(sel.data.endCol + colInc, maxCol))
        this._setSelection(row, col, row, col)
      }
    }
  }

  _getRectangle(sel) {
    return {
      minRow: Math.min(sel.data.startRow, sel.data.endRow),
      maxRow: Math.max(sel.data.startRow, sel.data.endRow),
      minCol: Math.min(sel.data.startCol, sel.data.endCol),
      maxCol: Math.max(sel.data.startCol, sel.data.endCol)
    }
  }

  _renderSelection() {
    let sel = this.getSelection()
    if (!sel) return

    let rect = this._getRectangle(sel)

    let startCell = this._getCell(rect.minRow, rect.minCol)
    let endCell = this._getCell(rect.maxRow, rect.maxCol)

    let startEl = startCell.getNativeElement()
    let endEl = endCell.getNativeElement()
    let tableEl = this.el.el
    // Get the  bounding rect for startEl, endEl relative to tableEl
    let selRect = getRelativeBoundingRect([startEl, endEl], tableEl)
    this.refs.selection.css(selRect).addClass('sm-visible')
    this._enableCells()
  }

  _enableCells() {
    let node = this.props.node
    for(let i=0; i<node.cells.length; i++) {
      let row = node.cells[i]
      for(let j=0; j<row.length; j++) {
        let cellId = row[j]
        let cell = this._getCell(i, j).getChildAt(0)
        if (this._selectedCells[cellId]) {
          cell.extendProps({ disabled: false })
        } else {
          cell.extendProps({ disabled: true })
        }
      }
    }
  }

  _getCell(row, col) {
    let rowEl = this.refs.body.getChildAt(row)
    // +2 because we have a row handle plus a spacer cell
    let cellEl = rowEl.getChildAt(col + 2)
    return cellEl
  }

  _whenClickingOnSelection(e) { //eslint-disable-line
    // HACK: invalidating the selection so that we can click the selection overlay away
    this.context.documentSession.setSelection(new CustomSelection('null', {}, this.getId()))
    this.refs.selection.css({
      height: '0px', width: '0px'
    }).removeClass('sm-visible')
  }
}

export default TableComponent

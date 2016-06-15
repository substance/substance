'use strict';

var Component = require('../../ui/Component');
var CustomSelection = require('../../model/CustomSelection');
var DefaultDOMElement = require('../../ui/DefaultDOMElement');
var tableHelpers = require('./tableHelpers');
var keys = require('../../util/keys');
var getRelativeBoundingRect = require('../../util/getRelativeBoundingRect');
var TextCellContent = require('./TextCellContent');

function TableComponent() {
  TableComponent.super.apply(this, arguments);

  if (this.context.surfaceParent) {
    this.surfaceId = this.context.surfaceParent.getId();
  } else {
    this.surfaceId = this.props.node.id;
  }

  this._selectedCells = {};
}

TableComponent.Prototype = function() {

  this.didMount = function() {
    var documentSession = this.getDocumentSession();
    documentSession.on('didUpdate', this.onSessionDidUpdate, this);

    var globalEventHandler = this.context.globalEventHandler;
    if (globalEventHandler) {
      globalEventHandler.on('keydown', this.onKeydown, this, { id: this.surfaceId });
    }
  };

  this.dispose = function() {
    var documentSession = this.getDocumentSession();
    documentSession.off(this);

    var globalEventHandler = this.context.globalEventHandler;
    if (globalEventHandler) {
      globalEventHandler.off(this);
    }
  };

  this.render = function($$) {
    var node = this.props.node;

    var el = $$('div').addClass('sc-table');

    var tableEl = $$('table');
    var cellEntries = node.cells;

    var nrows = node.getRowCount();
    var ncols = node.getColCount();
    var i,j;

    var thead = $$('thead').addClass('se-head');
    var colControls = $$('tr').addClass('se-column-controls');
    colControls.append($$('td').addClass('se-corner-tl'));
    colControls.append($$('td').addClass('se-hspace'));
    for (j = 0; j < ncols; j++) {
      colControls.append(
        $$('td').addClass('se-column-handle').attr('data-col', j).ref('col-handle'+j)
          .on('mousedown', this._onColumnHandle)
          .append(tableHelpers.getColumnName(j))
      );
    }
    colControls.append($$('td').addClass('se-hspace'));
    thead.append(colControls);
    thead.append($$('tr').addClass('se-vspace'));

    var tbody = $$('tbody').addClass('se-body').ref('body');
    for (i = 0; i < nrows; i++) {
      var row = cellEntries[i];
      var rowEl = $$('tr').addClass('se-row').attr('data-row', i);

      rowEl.append(
        $$('td').addClass('se-row-handle').attr('data-row', i).ref('row-handle'+i)
          .on('mousedown', this._onRowHandle)
          .append(tableHelpers.getRowName(i))
      );
      rowEl.append($$('td').addClass('se-hspace'));

      console.assert(row.length === ncols, 'row should be complete.');
      for (j = 0; j < ncols; j++) {
        var cellId = row[j];
        var cellEl = this.renderCell($$, cellId);
        cellEl.attr('data-col', j)
          .on('mousedown', this._onCell);
        rowEl.append(cellEl);
      }
      rowEl.append($$('td').addClass('se-hspace'));

      tbody.append(rowEl);
    }

    var tfoot = $$('tfoot').addClass('se-foot');
    tfoot.append($$('tr').addClass('se-vspace'));
    colControls = $$('tr').addClass('se-column-controls');
    colControls.append($$('td').addClass('se-corner-bl'));
    colControls.append($$('td').addClass('se-hspace'));
    for (j = 0; j < ncols; j++) {
      colControls.append($$('td').addClass('se-hspace'));
    }
    colControls.append($$('td').addClass('se-hspace'));
    tfoot.append(colControls);

    tableEl.append(thead);
    tableEl.append(tbody);
    tableEl.append(tfoot);

    el.append(tableEl);

    // selection as an overlay
    el.append(
      $$('div').addClass('se-selection').ref('selection')
        .on('mousedown', this._whenClickingOnSelection)
    );

    return el;
  };

  this.renderCell = function($$, cellId) {
    var cellEl = $$('td').addClass('se-cell');
    var doc = this.props.node.getDocument();
    var cellContent = doc.get(cellId);
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
      );
    }

    return cellEl;
  };

  this.getId = function() {
    return this.surfaceId;
  };

  this.getDocumentSession = function() {
    return this.context.documentSession;
  };

  this.getSelection = function() {
    var documentSession = this.getDocumentSession();
    var sel = documentSession.getSelection();
    if (sel && sel.isCustomSelection() && sel.getCustomType() === 'table' && sel.surfaceId === this.getId()) {
      return sel;
    } else {
      return null;
    }
  };

  this._setSelection = function(startRow, startCol, endRow, endCol) {
    var documentSession = this.getDocumentSession();
    documentSession.setSelection(new CustomSelection('table', {
      startRow: startRow, startCol: startCol,
      endRow: endRow, endCol: endCol
    }, this.getId()));
  };

  this.onSessionDidUpdate = function(update) {
    if (update.selection) {
      var sel = this.getSelection();
      this._selectedCells = {};
      if (sel) {
        var rect = this._getRectangle(sel);
        for(var i=rect.minRow; i<=rect.maxRow; i++) {
          for(var j=rect.minCol; j<=rect.maxCol; j++) {
            var cellId = this.props.node.cells[i][j];
            this._selectedCells[cellId] = true;
          }
        }
        this._renderSelection(sel);
      }
    }
  };

  this.onKeydown = function(e) {
    var handled = false;
    switch (e.keyCode) {
      case keys.LEFT:
        this._changeSelection(0, -1, e.shiftKey);
        handled = true;
        break;
      case keys.RIGHT:
        this._changeSelection(0, 1, e.shiftKey);
        handled = true;
        break;
      case keys.DOWN:
        this._changeSelection(1, 0, e.shiftKey);
        handled = true;
        break;
      case keys.UP:
        this._changeSelection(-1, 0, e.shiftKey);
        handled = true;
        break;
      default:
        // nothing
    }
    if (handled) {
      e.preventDefault();
    }
  };

  this._onColumnHandle = function(e) {
    e.stopPropagation();
    e.preventDefault();
    var el = DefaultDOMElement.wrapNativeElement(e.currentTarget);
    var col = parseInt(el.attr('data-col'), 10);
    var rowCount = this.props.node.getRowCount();
    this._setSelection(0, col, rowCount-1, col);
  };

  this._onRowHandle = function(e) {
    e.stopPropagation();
    e.preventDefault();
    var el = DefaultDOMElement.wrapNativeElement(e.currentTarget);
    var row = parseInt(el.attr('data-row'), 10);
    var colCount = this.props.node.getColCount();
    this._setSelection(row, 0, row, colCount-1);
  };

  this._onCell = function(e) {
    e.stopPropagation();
    e.preventDefault();

    var el = DefaultDOMElement.wrapNativeElement(e.currentTarget);
    var col = parseInt(el.attr('data-col'), 10);
    var row = parseInt(el.parentNode.attr('data-row'), 10);

    this._setSelection(row, col, row, col);
  };

  this._changeSelection = function(rowInc, colInc, expand) {
    var sel = this.getSelection();
    if (sel) {
      var maxRow = this.props.node.getRowCount()-1;
      var maxCol = this.props.node.getColCount()-1;
      if (expand) {
        var endRow = Math.max(0, Math.min(sel.data.endRow + rowInc, maxRow));
        var endCol = Math.max(0, Math.min(sel.data.endCol + colInc, maxCol));
        this._setSelection(sel.data.startRow, sel.data.startCol, endRow, endCol);
      } else {
        var row = Math.max(0, Math.min(sel.data.endRow + rowInc, maxRow));
        var col = Math.max(0, Math.min(sel.data.endCol + colInc, maxCol));
        this._setSelection(row, col, row, col);
      }
    }
  };

  this._getRectangle = function(sel) {
    return {
      minRow: Math.min(sel.data.startRow, sel.data.endRow),
      maxRow: Math.max(sel.data.startRow, sel.data.endRow),
      minCol: Math.min(sel.data.startCol, sel.data.endCol),
      maxCol: Math.max(sel.data.startCol, sel.data.endCol)
    };
  };

  this._renderSelection = function() {
    var sel = this.getSelection();
    if (!sel) return;

    var rect = this._getRectangle(sel);

    var startCell = this._getCell(rect.minRow, rect.minCol);
    var endCell = this._getCell(rect.maxRow, rect.maxCol);

    var startEl = startCell.getNativeElement();
    var endEl = endCell.getNativeElement();
    var tableEl = this.el.el;
    // Get the  bounding rect for startEl, endEl relative to tableEl
    var selRect = getRelativeBoundingRect([startEl, endEl], tableEl);
    this.refs.selection.css(selRect).addClass('sm-visible');
    this._enableCells();
  };

  this._enableCells = function() {
    var node = this.props.node;
    for(var i=0; i<node.cells.length; i++) {
      var row = node.cells[i];
      for(var j=0; j<row.length; j++) {
        var cellId = row[j];
        var cell = this._getCell(i, j).getChildAt(0);
        if (this._selectedCells[cellId]) {
          cell.extendProps({ disabled: false });
        } else {
          cell.extendProps({ disabled: true });
        }
      }
    }
  };

  this._getCell = function(row, col) {
    var rowEl = this.refs.body.getChildAt(row);
    // +2 because we have a row handle plus a spacer cell
    var cellEl = rowEl.getChildAt(col + 2);
    return cellEl;
  };

  this._whenClickingOnSelection = function(e) { //eslint-disable-line
    // HACK: invalidating the selection so that we can click the selection overlay away
    this.context.documentSession.setSelection(new CustomSelection('null', {}, this.getId()));
    this.refs.selection.css({
      height: '0px', width: '0px'
    }).removeClass('sm-visible');
  };
};

Component.extend(TableComponent);

module.exports = TableComponent;

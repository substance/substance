'use strict';

var assert = require('../../util/assert');
var Component = require('../../ui/Component');
var CustomSelection = require('../../model/CustomSelection');
var ContainerEditor = require('../../ui/ContainerEditor');
var DefaultDOMElement = require('../../ui/DefaultDOMElement');
var TextPropertyEditor = require('../../ui/TextPropertyEditor');
var tableHelpers = require('./tableHelpers');
var keys = require('../../util/keys');

// doh: we don't do $el.position() properly yet
var $ = require('../../util/jquery');

function TableComponent() {
  TableComponent.super.apply(this, arguments);

  if (this.context.surfaceParent) {
    this.surfaceId = this.context.surfaceParent.getId();
  } else {
    this.surfaceId = this.props.node.id;
  }
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

      assert(row.length === ncols, 'row should be complete.');
      for (j = 0; j < ncols; j++) {
        var cellEntry = row[j];
        var cellEl = this.renderCell($$, cellEntry);
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

  this.renderCell = function($$, cellEntry) {
    var cellEl = $$('td').addClass('se-cell');
    var doc = this.props.node.getDocument();
    if (cellEntry) {
      var id = cellEntry.content;
      var cellContent = doc.get(id);
      if (cellContent) {
        var cellContentEl = this.renderCellContent($$, cellContent);
        cellContentEl.ref(id);
        cellEl.append(cellContentEl);
      }
    }
    return cellEl;
  };

  this.renderCellContent = function($$, cellContent) {
    var el;
    // TODO: what if this is used in a read-only environment?
    if (cellContent.isText()) {
      el = $$(TextPropertyEditor, {
        disabled: this.props.disabled,
        path: cellContent.getTextPath()
      });
    } else if (cellContent._isContainer) {
      el = $$(ContainerEditor, {
        disabled: this.props.disabled,
        node: cellContent
      });
    } else {
      var componentRegistry = this.context.componentRegistry;
      var ComponentClass = componentRegistry.get(cellContent.type);
      if (ComponentClass) {
        el = $$(ComponentClass, { node: cellContent });
      }
    }
    return el;
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
    if (sel.surfaceId === this.getId()) {
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
    }, this.getId()))
  };

  this.onSessionDidUpdate = function(update) {
    if (update.selection) {
      var sel = this.getSelection();
      if (sel && sel.getType() === 'table') {
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
      var documentSession = this.getDocumentSession();
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

  this._renderSelection = function() {
    var sel = this.getSelection();
    var minRow = Math.min(sel.data.startRow, sel.data.endRow);
    var maxRow = Math.max(sel.data.startRow, sel.data.endRow);
    var minCol = Math.min(sel.data.startCol, sel.data.endCol);
    var maxCol = Math.max(sel.data.startCol, sel.data.endCol);
    var startCell = this._getCell(minRow, minCol);
    var endCell = this._getCell(maxRow, maxCol);
    // TODO: we need to fix BrowserDOMElement so that we get the right values;
    var startEl = startCell.getNativeElement();
    var endEl = endCell.getNativeElement();
    var pos1 = $(startEl).position();
    var pos2 = $(endEl).position();
    var rect2 = endEl.getBoundingClientRect();
    this.refs.selection.css({
      top: pos1.top,
      left: pos1.left,
      height: pos2.top - pos1.top + rect2.height,
      width: pos2.left - pos1.left + rect2.width
    }).addClass('sm-visible');
  };

  this._getCell = function(row, col) {
    var rowEl = this.refs.body.getChildAt(row);
    // +2 because we have a row handle plus a spacer cell
    var cellEl = rowEl.getChildAt(col + 2);
    return cellEl;
  };

  this._whenClickingOnSelection = function(e) {
    // HACK: invalidating the selection so that we can click the selection overlay away
    this.context.documentSession.setSelection(new CustomSelection('null', {}, this.getId()));
    this.refs.selection.css({
      height: '0px', width: '0px'
    }).removeClass('sm-visible');
  };
};

Component.extend(TableComponent);

module.exports = TableComponent;

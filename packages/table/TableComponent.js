'use strict';

var assert = require('../../util/assert');
var Component = require('../../ui/Component');
var ContainerEditor = require('../../ui/ContainerEditor');
var DefaultDOMElement = require('../../ui/DefaultDOMElement');
var TextPropertyEditor = require('../../ui/TextPropertyEditor');
var tableHelpers = require('./tableHelpers');
var TableSelection = require('./TableSelection');
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
    var documentSession = this.context.documentSession;
    documentSession.on('didUpdate', this.onSessionDidUpdate, this);

    var globalEventHandler = this.context.globalEventHandler;
    if (globalEventHandler) {
      globalEventHandler.on('keydown', this.onKeydown, this, { id: this.surfaceId });
    }
  };

  this.dispose = function() {
    var documentSession = this.context.documentSession;
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
        $$('td').addClass('se-column-handle').ref('col-handle'+j)
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
        $$('td').addClass('se-row-handle').ref('row-handle'+i)
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
    el.append($$('div').addClass('se-selection').ref('selection'));

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

  this.getSelection = function() {
    var documentSession = this.context.documentSession;
    var sel = documentSession.getSelection();
    if (sel.surfaceId === this.getId()) {
      return sel;
    } else {
      return null;
    }
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
    console.log('TableComponent.onKeydown');
  };

  this._onColumnHandle = function(e) {
    e.stopPropagation();
    e.preventDefault();
    console.log('Clicked on column handle.');
  };

  this._onRowHandle = function(e) {
    e.stopPropagation();
    e.preventDefault();
    console.log('Clicked on row handle.');
  };

  this._onCell = function(e) {
    e.stopPropagation();
    e.preventDefault();

    var el = DefaultDOMElement.wrapNativeElement(e.currentTarget);
    var col = parseInt(el.attr('data-col'), 10);
    var row = parseInt(el.parentNode.attr('data-row'), 10);

    console.log('Clicked on cell %s, %s', row, col);

    var documentSession = this.context.documentSession;
    documentSession.setSelection(new TableSelection({
      startRow: row, endRow: row,
      startCol: col, endCol: col
    }, this.getId()));
  };

  this._renderSelection = function() {
    var sel = this.getSelection();
    var startCell = this._getCell(sel.data.startRow, sel.data.startCol);
    var endCell = this._getCell(sel.data.endRow, sel.data.endCol);
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

};

Component.extend(TableComponent);

module.exports = TableComponent;

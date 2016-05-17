'use strict';

var each = require('lodash/each');
var $ = require('../../util/jquery');
var Component = require('../../ui/Component');
var TextProperty = require('../../ui/TextPropertyComponent');
var TableSelection = require('../../model/TableSelection');

function TableComponent() {
  TableComponent.super.apply(this, arguments);
}

TableComponent.Prototype = function() {

  this.getInitialState = function() {
    return { mode: 'table' };
  };

  this.render = function($$) {
    var tableEl = $$('table')
      .addClass("content-node table")
      .attr({
        "data-id": this.props.node.id,
        contentEditable: false
      });
    if (this.state.mode === "table") {
      tableEl.addClass('table-editing-mode');
    } else if (this.state.mode === "cell") {
      tableEl.addClass('cell-editing-mode');
    }
    // HACK: make sure row col indexes are up2date
    this.props.node.getMatrix();
    tableEl.append(this.renderTableContent($$));
    return tableEl;
  };

  this.renderTableContent = function($$) {
    var content = [];
    each(this.props.node.getSections(), function(sec) {
      var secEl = $$("t"+sec.sectionType).key(sec.id);
      each(sec.getRows(), function(row) {
        var rowEl = $$("tr").attr({"data-id": row.id, contentEditable:false});
        each(row.getCells(), function(cell) {
          var cellEl = $$((cell.cellType === 'head') ? 'th' : 'td')
            .attr({
              "data-id": cell.id,
              "data-row": cell.rowIdx,
              "data-col": cell.colIdx,
            })
            .on('mousedown', this.onMouseDown)
            .on('doubleclick', this.onDoubleClick);
          if (cell.colspan) {
            cellEl.attr("colspan", cell.colspan);
          }
          if (cell.rowspan) {
            cellEl.attr('rowspan', cell.rowspan);
          }
          if (this.state.mode === "cell") {
            if (cell.rowIdx === this.state.row && cell.colIdx === this.state.col) {
              cellEl.attr('contentEditable', true);
            }
          }
          cellEl.append($$(TextProperty, {
            path: [ cell.id, "content"]
          }));
          rowEl.append(cellEl);
        }.bind(this));
        secEl.append(rowEl);
      }.bind(this));
      content.push(secEl);
    }.bind(this));
    return content;
  };

  this.onDoubleClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    var surface = this.context.surface;
    var $cell = $(e.currentTarget);
    var cellId = $cell.data('id');
    // switch the state
    this.setState({
      mode: "cell",
      cellId: cellId,
      row: $cell.data('row'),
      col: $cell.data('col')
    }, function() {
      var doc = surface.getDocument();
      var path = [cellId, 'content'];
      var text = doc.get(path);
      surface.setSelection({
        type: 'property',
        path: path,
        startOffset: text.length,
      });
    });
  };

  this.onMouseDown = function(e) {
    var $el = this.$el;
    var surface = this.context.surface;
    var doc = surface.getDocument();
    var id = this.props.node.id;
    var self = this;
    // 1. get the anchor cell (for click or select)
    var $cell = $(e.currentTarget);

    if (this.state.mode === "cell" && this.state.cellId === $cell.data('id')) {
      // do not override selection behavior within a cell
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    var $startCell = $cell;
    var $endCell = $cell;
    var rectangle = new TableSelection.Rectangle(
      $startCell.data('row'),
      $startCell.data('col'),
      $endCell.data('row'),
      $endCell.data('col')
    );
    // 2. enable onMouseOver delegate which updates the displayed selection region
    var onMouseOver = function(e) {
      $endCell = $(e.currentTarget);
      rectangle = new TableSelection.Rectangle($startCell.data('row'), $startCell.data('col'),
        $endCell.data('row'), $endCell.data('col'));
      self._updateSelection(rectangle);
    };
    $el.on('mouseenter', 'th,td', onMouseOver);
    // 3. enable onMouseUp hook: stop dragging the selection and
    // finally set the Surface's selection
    $(window).one('mouseup', function(e) {
      e.stopPropagation();
      e.preventDefault();
      $el.off('mouseenter', 'th,td', onMouseOver);
      var tableSelection = doc.createSelection({
        type: 'table',
        tableId: id,
        rectangle: rectangle
      });
      surface.setSelection(tableSelection);
    });
  };

  this.onSelectionChange = function(sel) {
    var node = this.props.node;
    var id = node.id;
    if (this.hasSelection) {
      this._clearSelection();
    }
    if (this.state.mode === "cell") {
      if (!sel.isPropertySelection() || sel.start.path[0] !== this.state.cellId) {
        var self = this;
        this.setState({
          mode: "table"
        }, function() {
          if (sel.isTableSelection() && sel.getTableId() === id) {
            self._updateSelection(sel.rectangle);
          }
        });
      }
    } else {
      if (sel.isTableSelection() && sel.getTableId() === id) {
        this._updateSelection(sel.rectangle);
      }
    }
  };

  this._updateSelection = function(rectangle) {
    var $el = this.$el;
    var $cells = $el.find('th,td');
    $cells.each(function() {
      var $cell = $(this);
      var row = $cell.data('row');
      var col = $cell.data('col');
      if (row >= rectangle.start.row && row <= rectangle.end.row &&
        col >= rectangle.start.col && col <= rectangle.end.col) {
        $cell.addClass("selected");
      } else {
        $cell.removeClass("selected");
      }
    });
    this.hasSelection = true;
  };

  this._clearSelection = function() {
    var $el = this.$el;
    var $cells = $el.find('th,td');
    $cells.removeClass('selected');
    this.hasSelection = false;
  };
};

Component.extend(TableComponent);

module.exports = TableComponent;

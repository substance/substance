'use strict';

var Component = require('../../ui/Component');
var TextPropertyEditor = require('../../ui/TextPropertyEditor');
var ContainerEditor = require('../../ui/ContainerEditor');

function TableComponent() {
  TableComponent.super.apply(this, arguments);
}

TableComponent.Prototype = function() {

  this.render = function($$) {
    var node = this.props.node;
    var tableEl = $$('table').addClass('sc-table');
    var cellEntries = node.cells;

    for (var i = 0; i < cellEntries.length; i++) {
      var row = cellEntries[i];
      var rowEl = $$('tr').addClass('se-row');
      for (var j = 0; j < row.length; j++) {
        var cellEntry = row[j];
        var cellEl = this.renderCell($$, cellEntry);
        rowEl.append(cellEl);
      }
      tableEl.append(rowEl);
    }

    return tableEl;
  };

  this.renderCell = function($$, cellEntry) {
    var cellEl = $$('td').addClass('se-cell');
    var doc = this.props.node.getDocument();
    if (cellEntry) {
      var id = cellEntry.content;
      var cellContent = doc.get(id);
      if (cellContent) {
        var cellContentEl = this.renderCellContent($$, cellContent);
        cellContentEl.ref(id)
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
};

Component.extend(TableComponent);

module.exports = TableComponent;

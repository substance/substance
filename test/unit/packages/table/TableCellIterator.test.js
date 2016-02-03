'use strict';

require('../../qunit_extensions');
var sample = require('../../../fixtures/sample1.js');
var uuid = require('../../../../util/uuid');

var TableCellIterator = require('../../../../packages/table/TableCellIterator');

QUnit.module('packages/table/TableCellIterator');

QUnit.test('Iterator should return as many cells as were created', function (assert) {
  var article = sample();

  var newTableId = uuid('table');
  var newSectionId = uuid('table-section');
  var newRowId = uuid('table-row');

  article.FORCE_TRANSACTIONS = false;
  var newCell1 = article.create({
    id: uuid('table-cell'),
    type: 'table-cell',
    parent: newRowId,
    content: 'cell 0',
    cellType: 'data'
  });

  var newCell2 = article.create({
    id: uuid('table-cell'),
    type: 'table-cell',
    parent: newRowId,
    content: 'cell 1',
    cellType: 'data'
  });

  var newRow = article.create({
    id: newRowId,
    type: 'table-row',
    parent: newSectionId,
    cells: [newCell1.id, newCell2.id]
  });

  var newSection = article.create({
    id: newSectionId,
    type: 'table-section',
    parent: newTableId,
    sectionType: 'body',
    rows: [newRow.id]
  });

  article.create({
    id: newTableId,
    type: 'table',
    sections: [newSection.id]
  });

  var table = article.get(newTableId);
  var iterator = new TableCellIterator(table);

  var cellNode;
  var cellNodeCount = 0;
  while ((cellNode = iterator.next()) !== null) {
    cellNodeCount++;
  }

  assert.equal(cellNodeCount, 2);
});
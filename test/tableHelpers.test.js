import { test } from 'substance-test'
import { tableHelpers } from 'substance'

test('tableHelpers: getColumnLabel()', t => {
  t.equal(tableHelpers.getColumnLabel(0), 'A')
  t.equal(tableHelpers.getColumnLabel(26), 'AA')
  t.end()
})

test('tableHelpers: getColumnIndex()', t => {
  t.equal(tableHelpers.getColumnIndex('A'), 0)
  t.equal(tableHelpers.getColumnIndex('AA'), 26)
  t.equal(tableHelpers.getColumnIndex('AB'), 27)
  t.equal(tableHelpers.getColumnIndex('AZ'), 51)
  t.equal(tableHelpers.getColumnIndex('BA'), 52)
  t.equal(tableHelpers.getColumnIndex('ABC'), ((1 * 26 * 26) + (2 * 26) + 3) - 1)
  t.end()
})

test('tableHelpers: getRowCol()', t => {
  t.deepEqual(tableHelpers.getRowCol('A1'), [0, 0])
  t.deepEqual(tableHelpers.getRowCol('AA2'), [1, 26])
  t.end()
})

test('tableHelpers: getCellLabel()', t => {
  t.equal(tableHelpers.getCellLabel(0, 0), 'A1')
  t.equal(tableHelpers.getCellLabel(1, 26), 'AA2')
  t.end()
})

test('tableHelpers: getIndexesFromRange()', t => {
  t.deepEqual(tableHelpers.getIndexesFromRange('A1', 'B10'), {
    startRow: 0,
    startCol: 0,
    endRow: 9,
    endCol: 1
  })
  // should be independent of order
  t.deepEqual(tableHelpers.getIndexesFromRange('B10', 'A1'), {
    startRow: 0,
    startCol: 0,
    endRow: 9,
    endCol: 1
  })
  t.end()
})

test('tableHelpers: getRangeFromMatrix()', t => {
  let cells = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12]
  ]
  // single cell
  t.deepEqual(tableHelpers.getRangeFromMatrix(cells, 0, 1, 0, 1), 2)
  // slice of a row
  t.deepEqual(tableHelpers.getRangeFromMatrix(cells, 0, 1, 0, 2), [2, 3])
  // slice of a column
  t.deepEqual(tableHelpers.getRangeFromMatrix(cells, 0, 1, 2, 1), [2, 5, 8])
  // range
  t.deepEqual(tableHelpers.getRangeFromMatrix(cells, 0, 0, 1, 1), [[1, 2], [4, 5]])
  // force 2D
  t.deepEqual(tableHelpers.getRangeFromMatrix(cells, 0, 1, 0, 1, true), [[2]])
  t.deepEqual(tableHelpers.getRangeFromMatrix(cells, 0, 1, 0, 2, true), [[2, 3]])
  t.deepEqual(tableHelpers.getRangeFromMatrix(cells, 0, 1, 2, 1, true), [[2], [5], [8]])
  t.end()
})

var OO = require('../../basics/oo');

/**
 * A helper class that allows random access to the table cells
 * and introduces place-holders for fields occupied by spanning cells,
 * making it a non-sparse representation of the sparse HTML model.
 * This is essential for the implementation of table manipulations, such as row insertions or deletions.
 *
 * Example:
 *
 * <table>
 *   <tr><td rowspan=2>1</td><td colspan=2>2</td><td rowspan=2 colspan=2>3</td></tr>
 *   <tr><td>4</td><td>5</td></tr>
 * </table>
 *
 * Visually this table would look like:
 *
 *  -------------------
 * | 1 | 2     | 3     |
 * |   |-------|       |
 * |   | 4 | 5 |       |
 *  -------------------
 *
 * The HTML model is sparse which makes it hard to read but also difficult to work with programmatically.
 * The corresponding TableCellMatrix would look like:
 *
 * | C[1] | C[2] | P[2] | C[3] | P[3] |
 * | P[1] | C[4] | C[5] | P[3] | P[3] |
 *
 * Where C[1] represents a Cell instance wrapping cell 1,
 * and P[1] a PlaceHolder instance owned by that cell.
 *
 * @class
 * @constructor
 * @param {ve.dm.TableNode} [tableNode] Reference to a table instance
 */
function TableMatrix(tableNode) {
  this.tableNode = tableNode;
  // Do not access these directly as they get invalidated on structural changes
  // Use the accessor methods instead.
  this._matrix = null;
  this._rowNodes = null;
}

TableMatrix.Prototype = function() {
  /**
   * Invalidates the matrix structure.
   *
   * This is called by ve.dm.TableNode on structural changes.
   */
  this.invalidate = function() {
    this._matrix = null;
    this._rowNodes = null;
  };

  /**
   * Recreates the matrix structure.
   */
  this.update = function() {
    var cellNode, cell,
      rowSpan, colSpan, i, j, _row, _col,
      matrix = [],
      rowNodes = [],
      iterator = this.tableNode.getIterator(),
      row = -1, col = -1;

    // hook to react on row transitions
    iterator.onNewRow = function( rowNode ) {
      row++; col = -1;
      // initialize a matrix row
      matrix[row] = matrix[row] || [];
      // store the row node
      rowNodes.push(rowNode);
    };

    // Iterates through all cells and stores the cells as well as
    // so called placeholders into the matrix.
    while ((cellNode = iterator.next()) !== null)  {
      col++;
      // skip placeholders
      while (matrix[row][col]) {
        col++;
      }
      cell = new TableMatrix.Cell(cellNode, row, col);
      // store indexes
      cellNode.rowIdx = row;
      cellNode.colIdx = col;
      // store the cell in the matrix
      matrix[row][col] = cell;
      // add place holders for spanned cells
      rowSpan = cellNode.getSpan('row');
      colSpan = cellNode.getSpan('col');
      if (rowSpan === 1 && colSpan === 1) continue;
      for (i = 0; i < rowSpan; i++) {
        for (j = 0; j < colSpan; j++) {
          if (i===0 && j===0) continue;
          _row = row + i;
          _col = col + j;
          // initialize the cell matrix row if not yet present
          matrix[_row] = matrix[_row] || [];
          matrix[_row][_col] = new TableMatrix.Placeholder(cell, _row, _col);
        }
      }
    }
    this._matrix = matrix;
    this._rowNodes = rowNodes;
  };

  /**
   * Retrieves a single cell.
   *
   * @param {Number} [row]
   * @param {Number} [col]
   * @return {ve.dm.TableMatrix.Cell}
   */
  this.getCell = function(row, col) {
    var matrix = this.getMatrix();
    return matrix[row][col];
  };

  /**
   * Retrieves all cells of a column with given index.
   *
   * @param {Number} [col]
   * @return {ve.dm.TableMatrix.Cell[]} The cells of a column
   */
  this.getColumn = function(col) {
    var cells, row,
      matrix = this.getMatrix();
    cells = [];
    for (row = 0; row < matrix.length; row++) {
      cells.push(matrix[row][col]);
    }
    return cells;
  };

  /**
   * Retrieves all cells of a row with given index.
   *
   * @param {Number} [row]
   * @return {ve.dm.TableMatrix.Cell[]} The cells of a row
   */
  this.getRow = function(row) {
    var matrix = this.getMatrix();
    return matrix[row];
  };

  /**
   * Retrieves the row node of a row with given index.
   *
   * @param {Number} [row]
   * @return {ve.dm.TableRowNode}
   */
  this.getRowNode = function(row) {
    var rowNodes = this.getRowNodes();
    return rowNodes[row];
  };

  /**
   * Provides a reference to the internal cell matrix.
   *
   * Note: this is primarily for internal use. Do not change the delivered matrix
   * and do not store as it may be invalidated.
   *
   * @return {ve.dm.TableMatrix.Cell[]}
   */
  this.getMatrix = function() {
    if (!this._matrix) this.update();
    return this._matrix;
  };

  /**
   * Provides a reference to the internal array of row nodes.
   *
   * Note: this is primarily for internal use. Do not change the delivered array
   * and do not store it as it may be invalidated.
   *
   * @return {ve.dm.TableRowNode[]}
   */
  this.getRowNodes = function() {
    if (!this._rowNodes) this.update();
    return this._rowNodes;
  };

  /**
   * Computes a the rectangle for a given start and end cell node.
   *
   *
   * @param {ve.dm.TableCellNode} [startCellNode] start anchor
   * @param {ve.dm.TableCellNode} [endCellNode] end anchor
   * @return {ve.dm.TableMatrix.Rectangle}
   */
  this.getRectangle = function ( startCellNode, endCellNode ) {
    var startCell, endCell, minRow, maxRow, minCol, maxCol;
    startCell = this.lookupCell(startCellNode);
    if (!startCell) return null;
    if (startCellNode === endCellNode) {
      endCell = startCell;
    } else {
      endCell = this.lookupCell(endCellNode);
    }
    minRow = Math.min(startCell.row, endCell.row);
    maxRow = Math.max(startCell.row, endCell.row);
    minCol = Math.min(startCell.col, endCell.col);
    maxCol = Math.max(startCell.col, endCell.col);
    return new TableMatrix.Rectangle(minRow, minCol, maxRow, maxCol);
  };

  /**
   * Retrieves all cells (no placeholders) within a given rectangle.
   *
   * @param {ve.dm.TableMatrix.Rectangle} [rect]
   * @return {ve.dm.TableMatrix.Cell[]}
   */
  this.getCellsForRectangle = function ( rect ) {
    var row, col, cells, visited, cell;
    cells = [];
    visited = {};
    for (row = rect.start.row; row <= rect.end.row; row++) {
      for (col = rect.start.col; col <= rect.end.col; col++) {
        cell = this.getCell(row, col);
        if (cell.type === 'placeholder') cell = cell.owner;
        if (!visited[cell.key]) {
          cells.push(cell);
          visited[cell.key] = true;
        }
      }
    }
    return cells;
  };

  /**
   * Retrieves a bounding rectangle for all cells described by a given rectangle.
   * This takes spanning cells into account.
   *
   * @param {ve.dm.TableMatrix.Rectangle} [rect]
   * @return {ve.dm.TableMatrix.Rectangle} A new rectangle
   */
  this.getBoundingRectangle = function (rect) {
    var cells, cell, i;
    rect = TableMatrix.Rectangle.copy(rect);
    cells = this.getCellsForRectangle(rect);
    if (!cells || cells.length === 0) return null;
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      rect.start.row = Math.min(rect.start.row, cell.row);
      rect.start.col = Math.min(rect.start.col, cell.col);
      rect.end.row = Math.max(rect.end.row, cell.row + cell.node.getSpan('row') - 1);
      rect.end.col = Math.max(rect.end.col, cell.col + cell.node.getSpan('col') - 1);
    }
    return rect;
  };

  /**
   * Provides a tuple with number of rows and columns.
   *
   * @return {Number} (number of rows) X (number of columns)
   */
  this.getSize = function () {
    var matrix = this.getMatrix();
    if (matrix.length === 0) {
      return { rows: 0,  cols: 0 };
    } else {
      return { rows: matrix.length,  cols: matrix[0].length };
    }
  };

  /**
   * Looks up the cell for a given cell node.
   *
   * @return {ve.dm.TableMatrix.Cell} The cell or null if not found
   */
  this.lookupCell = function( cellNode ) {
    var row, col, cell, rowCells,
      matrix = this.getMatrix(),
      rowNodes = this.getRowNodes();
    row = rowNodes.indexOf(cellNode.parent);
    if (row < 0) return null;
    cell = null;
    rowCells = matrix[row];
    for (col = 0; col < rowCells.length; col++) {
      cell = rowCells[col];
      if (cell.node === cellNode) {
        break;
      }
    }
    return cell;
  };

  /**
   * Finds the closest cell not being a placeholder for a given cell.
   *
   * @return {ve.dm.TableMatrix.Cell}
   */
  this.findClosestCell = function(cell) {
    var col, rowCells,
      matrix = this.getMatrix();
    rowCells = matrix[cell.row];
    for (col = cell.col; col >= 0; col--) {
      if (rowCells[col].type === 'cell') return rowCells[col];
    }
    for (col = cell.col + 1; col < rowCells.length; col++) {
      if (rowCells[col].type === 'cell') return rowCells[col];
    }
    return null;
  };
};

OO.initClass(TableMatrix);

/**
 * An object wrapping a table cell node, augmenting it with row and column indexes.
 *
 * @class
 * @constructor
 * @param {ve.dm.TableCellNode} [node]
 * @param {Number} [row] row index
 * @param {Number} [col] column index
 */
TableMatrix.Cell = function Cell(node, row, col) {
  this.type = 'cell';
  this.node = node;
  this.row = row;
  this.col = col;
  this.key = row + '_' + col;
};

TableMatrix.Cell.sortDescending = function( a, b ) {
  if (a.row !== b.row) return b.row - a.row;
  return b.col - a.col;
};

/**
 * An object representing a cell which is occupied by another cell with 'rowspan' or 'colspan' attribute.
 * Placeholders are used to create a dense representation of the sparse HTML table model.
 *
 * @class
 * @constructor
 * @param {ve.dm.TableMatrix.Cell} [owner]
 * @param {Number} [row] row index
 * @param {Number} [col] column index
 */
TableMatrix.Placeholder = function PlaceHolder( owner, row, col ) {
  TableMatrix.Cell.call(this, owner.node, row, col);
  this.type = 'placeholder';
  this.owner = owner;
};

OO.inherit(TableMatrix.Placeholder, TableMatrix.Cell);

/**
 * An object describing a rectangular selection in a table matrix.
 * It has two properties, 'start' and 'end', which both are objects with
 * properties 'row' and 'col'. 'start' describes the upper-left, and
 * 'end' the lower-right corner of the rectangle.
 *
 * @class
 * @constructor
 * @param {Number} [minRow] row index of upper-left corner
 * @param {Number} [minCol] column index of upper-left corner
 * @param {Number} [maxRow] row index of lower-left corner
 * @param {Number} [maxCol] column index of lower-left corner
 */
TableMatrix.Rectangle = function( minRow, minCol, maxRow, maxCol ) {
  this.start = { row: minRow, col: minCol };
  this.end = { row: maxRow, col: maxCol };
};

TableMatrix.Rectangle.copy = function( rect ) {
  return new TableMatrix.Rectangle(rect.start.row, rect.start.col, rect.end.row, rect.end.col);
};

module.exports = TableMatrix;

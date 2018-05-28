import isNumber from './isNumber'

// TODO: this is redundant with some helpers in stencila-engine
// we should probably move all generic table helpers into substance
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function getColumnLabel (colIdx) {
  if (!isNumber(colIdx)) {
    throw new Error('Illegal argument.')
  }
  let label = ''
  while(true) { // eslint-disable-line
    let mod = colIdx % ALPHABET.length
    colIdx = Math.floor(colIdx / ALPHABET.length)
    label = ALPHABET[mod] + label
    if (colIdx > 0) colIdx--
    else if (colIdx === 0) break
  }
  return label
}

export function getRowCol (cellLabel) {
  var match = /^([A-Z]+)([1-9][0-9]*)$/.exec(cellLabel)
  return [
    parseInt(match[2], 10) - 1,
    getColumnIndex(match[1])
  ]
}

const A = 'A'.charCodeAt(0)
const ALPHABET_LENGTH = ALPHABET.length

export function getColumnIndex (colStr) {
  let index = 0
  let rank = 0
  for (let i = colStr.length - 1; i >= 0; i--) {
    let idx = colStr.charCodeAt(i) - A
    if (idx < 0 || idx >= ALPHABET_LENGTH) throw new Error('Illegal column label: ' + colStr)
    // Note: there is no 'zero' in 'A-Z', we use idx + 1
    index += Math.pow(ALPHABET_LENGTH, rank) * (idx + 1)
    rank++
  }
  // ... and because we want a zero-based column index at the end decrement the result
  return index - 1
}

export function getCellLabel (rowIdx, colIdx) {
  let colLabel = getColumnLabel(colIdx)
  let rowLabel = rowIdx + 1
  return colLabel + rowLabel
}

export function getIndexesFromRange (start, end) {
  let [startRow, startCol] = getRowCol(start)
  let endRow, endCol
  if (end) {
    ([endRow, endCol] = getRowCol(end))
    if (startRow > endRow) ([startRow, endRow] = [endRow, startRow])
    if (startCol > endCol) ([startCol, endCol] = [endCol, startCol])
  } else {
    ([endRow, endCol] = [startRow, startCol])
  }
  return { startRow, startCol, endRow, endCol }
}

export function getRangeFromMatrix (cells, startRow, startCol, endRow, endCol, force2D) {
  if (!force2D) {
    if (startRow === endRow && startCol === endCol) {
      let row = cells[startRow]
      if (row) return row[startCol]
      else return undefined
    }
    if (startRow === endRow) {
      let row = cells[startRow]
      if (row) return row.slice(startCol, endCol + 1)
      else return []
    }
    if (startCol === endCol) {
      let res = []
      for (let i = startRow; i <= endRow; i++) {
        let row = cells[i]
        if (row) res.push(row[startCol])
      }
      return res
    }
  }
  let res = []
  for (var i = startRow; i < endRow + 1; i++) {
    let row = cells[i]
    if (row) res.push(row.slice(startCol, endCol + 1))
  }
  return res
}

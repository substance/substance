import isNumber from 'lodash/isNumber'

let ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

function getColumnName(col) {
  if (!isNumber(col)) {
    throw new Error('Illegal argument.')
  }
  let name = ""
  while(col >= 0) {
    let mod = col % ALPHABET.length
    col = Math.floor(col/ALPHABET.length)
    name = ALPHABET[mod] + name
    if (col > 0) col--
    else break
  }
  return name
}

function getRowName(idx) {
  return String(idx+1)
}

function getColumnIndex(colStr) {
  let index = 0
  let rank = 1
  for (let i = 0; i < colStr.length; i++) {
    let letter = colStr[i]
    index += rank * ALPHABET.indexOf(letter)
    rank++
  }
  return index
}

function getCellId(row,col) {
  return getColumnName(col)+(row+1)
}

function getRowColFromId(id) {
  let match = /^([A-Z]+)([1-9][0-9]*)$/.exec(id)
  return [
    parseInt(match[2], 10)-1,
    getColumnIndex(match[1])
  ]
}

export default {
  getColumnName: getColumnName,
  getRowName: getRowName,
  getColumnIndex: getColumnIndex,
  getCellId: getCellId,
  getRowColFromId: getRowColFromId
}

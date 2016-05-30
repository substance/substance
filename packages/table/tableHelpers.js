'use strict';

var isNumber = require('lodash/isNumber');

var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function getColumnName(col) {
  if (!isNumber(col)) {
    throw new Error('Illegal argument.');
  }
  var name = "";
  while(true) {
    var mod = col % ALPHABET.length;
    col = Math.floor(col/ALPHABET.length);
    name = ALPHABET[mod] + name;
    if (col > 0) col--;
    else if (col === 0) break;
  }
  return name;
}

function getRowName(idx) {
  return ""+(idx+1);
}

function getColumnIndex(colStr) {
  var index = 0;
  var rank = 1;
  for (var i = 0; i < colStr.length; i++) {
    var letter = colStr[i];
    index += rank * ALPHABET.indexOf(letter);
    rank++;
  }
  return index;
}

function getCellId(row,col) {
  return getColumnName(col)+(row+1);
}

function getRowColFromId(id) {
  var match = /^([A-Z]+)([1-9][0-9]*)$/.exec(id);
  return [
    parseInt(match[2])-1,
    getColumnIndex(match[1])
  ];
}

module.exports = {
  getColumnName: getColumnName,
  getRowName: getRowName,
  getColumnIndex: getColumnIndex,
  getCellId: getCellId,
  getRowColFromId: getRowColFromId
};

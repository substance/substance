'use strict';

var isArray = require('lodash/isArray');
var isNumber = require('lodash/isNumber');
var isString = require('lodash/isString');
var _insertText = require('../../model/transform/insertText');

module.exports = function insertText(tx, args) {
  var path = args.path;
  if (!isArray(path)) {
    throw new Error('args.path is mandatory');
  }
  var pos = args.pos;
  if (!isNumber(pos)) {
    throw new Error('args.pos is mandatory');
  }
  var text = args.text;
  if (!isString(text)) {
    throw new Error('args.text is mandatory');
  }
  var sel = tx.createSelection({
    type: 'property',
    path: path,
    startOffset: pos,
    endOffset: pos
  });
  _insertText(tx, {
    selection: sel,
    text: text || '$$$'
  });
};

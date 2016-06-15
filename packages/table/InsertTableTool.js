'use strict';

var Tool = require('../../ui/Tool');

function InsertTableTool() {
  InsertTableTool.super.apply(this, arguments);
}

Tool.extend(InsertTableTool);

InsertTableTool.static.name = 'insert-table';

module.exports = InsertTableTool;

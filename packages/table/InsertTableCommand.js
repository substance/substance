'use strict';

var InsertNodeCommand = require('../../ui/InsertNodeCommand');

function InsertTableCommand() {
  InsertTableCommand.super.apply(this, arguments);
}

InsertTableCommand.Prototype = function() {

  this.createNodeData = function(tx, args) {
    // TODO: make this configurable, e.g. via args
    var nrows = 5;
    var ncols = 6;
    var cells = [];
    for (var i = 0; i < nrows; i++) {
      cells.push(new Array(ncols));
    }
    return {
      type: 'table',
      cells: cells
    };
  };

};

InsertNodeCommand.extend(InsertTableCommand);

InsertTableCommand.static.name = 'insert-table';

module.exports = InsertTableCommand;

'use strict';

var InsertNodeCommand = require('../../ui/InsertNodeCommand');
var uuid = require('../../util/uuid');

function InsertTableCommand() {
  InsertTableCommand.super.apply(this, { name: 'insert-table' });
}

InsertTableCommand.Prototype = function() {

  this.createNodeData = function(tx, args) { // eslint-disable-line
    // TODO: make this configurable, e.g. via args
    var nrows = 5;
    var ncols = 6;
    var cells = [];

    for (var i = 0; i < nrows; i++) {
      var cols = [];
      for (var j = 0; j < ncols; j++) {
        var node = tx.create({id: uuid(), type: 'paragraph', content: ''});
        cols.push({content: node.id});
      }


      cells.push(cols);
    }

    return {
      type: 'table',
      cells: cells
    };
  };

};

InsertNodeCommand.extend(InsertTableCommand);

module.exports = InsertTableCommand;

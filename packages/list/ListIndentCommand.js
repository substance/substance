'use strict';

var SurfaceCommand = require('../../ui/SurfaceCommand');


var ListIndentCommand = function(surface) {
  SurfaceCommand.call(this, surface);
};

ListIndentCommand.Prototype = function() {

  this.getSelection = function() {
    return this.getSurface().getSelection();
  };

  this.getCommandState = function() {
    var sel = this.getSelection();
    var doc = this.getDocument();
    var disabled = true;

    if (sel.isPropertySelection()){
      var path = sel.getPath();
      var node = doc.get(path[0]);
      disabled = (node.type !== 'list-item');
    }

    return {
      active: false,
      disabled: disabled
    };
  };

  this.execute = function() {
    var sel = this.getSelection();
    var doc = this.getDocument();
    var surface = this.getSurface();
    var path = sel.getPath();
    var node = doc.get(path[0]);

    surface.transaction(function(tx, args) {
      if (node.type === 'list-item') {
        var items = tx.get([node.parent, 'items']);
        var nodeIndex = items.indexOf(node.id);
        var contiguousItems = [];
        for (var i=nodeIndex; i>=0; i--){
          if(doc.get(items[i]).level === node.level+1){
            contiguousItems.push(items[i]);
          } else {
            break;
          }
        }
        for (i=nodeIndex+1; i<items.length; i++){
          if(doc.get(items[i]).level === node.level+1){
            contiguousItems.push(items[i]);
          } else {
            break;
          }
        }
        var ordered = contiguousItems.length > 0 ? doc.get(contiguousItems[0]).ordered : node.ordered;
        tx.set([node.id, 'level'], node.level+1);
        tx.set([node.id, 'ordered'], ordered);
      }
      return args;
    });
    return true;
  };
};

SurfaceCommand.extend(ListIndentCommand);
ListIndentCommand.static.name = 'indent-list-item';

module.exports = ListIndentCommand;

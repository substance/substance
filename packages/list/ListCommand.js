'use strict';

var _ = require('lodash');
var SurfaceCommand = require('../../ui/SurfaceCommand');


var listUtils = require('./listUtils');


var ListCommand = function(surface) {
  SurfaceCommand.call(this, surface);
};

ListCommand.Prototype = function() {

  this.getSelection = function() {
    return this.getSurface().getSelection();
  };

  this.getCommandState = function() {
    var surface = this.getSurface();
    var sel = this.getSelection();
    var doc = this.getDocument();
    var active, disabled;

    if (sel.isPropertySelection()){
      disabled = !surface.isEnabled() || sel.isNull();
      var path = sel.getPath();
      var node = doc.get(path[0]);
      active = (node.type === 'list-item') && (node.ordered === this.ordered);
    } else if (sel.isContainerSelection()) {
      // is enabled only if all selected nodes are paragraphs
      var nodes = sel.getContainer().nodes;
      var selectedNodes = _.slice(nodes, nodes.indexOf(sel.startPath[0]), nodes.indexOf(sel.endPath[0])+1);
      disabled = !_.every(_.map(selectedNodes, function(elem){
        return (doc.get(elem).type) === 'paragraph';
      }));
      var startNode = doc.get(sel.startPath[0]);
      active = false;
      if ((startNode.type === 'list-item') && (startNode.ordered == this.ordered)){
        var endNode = doc.get(sel.endPath[0]);
        if ((endNode.type === 'list-item') && (startNode.parent === endNode.parent)) active = true;
      }
    }

    return {
      active: active,
      disabled: disabled
    };
  };

  // Execute command and trigger transformations
  // TODO: This currently works for preoperty selection only. Make it work on container selection too.
  this.execute = function() {
    var sel = this.getSelection();
    var doc = this.getDocument();
    var surface = this.getSurface();
    var self = this;
    var containerId = this.getContainerId();

    if (!sel.isPropertySelection()){
      surface.transaction(function(tx, args){
        var selections = sel.splitIntoPropertySelections();
        var nodes = [];
        for (var i=0; i<selections.length; i++){
          nodes.push(tx.get(selections[i].path[0]));
        }
        var allParagraphs = _.every(_.map(nodes, function(node){
          return (node.type === 'paragraph');
        }));
        var listItemsofSameList = _.every(_.map(nodes, function(node){
          return ((node.type === 'list-item') && (nodes[0].parent === node.parent));
        }));
        if (allParagraphs){
          args.nodes = nodes;
          args.ordered = self.ordered;
          args.containerId = containerId;
          args.selection = sel;
          args = listUtils.paragraphsToList(tx, args);
        } else if (listItemsofSameList) {
          if (nodes[0].ordered === self.ordered){
            args.nodes = nodes;
            args.list = tx.get(nodes[0].parent);
            args.containerId = containerId;
            args = listUtils.listItemsToParagraph(tx, args);
          } else {
            // switch list type between ordered and unordered list
            var items = tx.get([nodes[0].parent, 'items']);
            for (i=0; i<items.length; i++){
              tx.set([items[i], 'ordered'], self.ordered);
            }
            tx.set([nodes[0].parent, 'ordered'], self.ordered);
          }
        }

        return args;
      });
    } else {
      var path = sel.getPath();
      var node = doc.get(path[0]);

      surface.transaction(function(tx, args) {
        if (node.type === 'list-item') {
          if (node.ordered === self.ordered){
            // convert list item to paragraph
            var parentList = tx.get(node.parent);
            args.nodes = [node];
            args.list = parentList;
            args.containerId = containerId;
            args = listUtils.listItemsToParagraph(tx, args);
          } else {
            // switch list type between ordered and unordered list
            var items = tx.get([node.parent, 'items']);
            for (var i=0; i<items.length; i++){
              if(doc.get(items[i]).level === node.level){
                tx.set([items[i], 'ordered'], self.ordered);
              }
            }
            if(node.level === 1) tx.set([node.parent, 'ordered'], self.ordered);
          }
        } else {
          // convert node to list
          args.nodes = [node];
          args.ordered = self.ordered;
          args.containerId = containerId;
          args.selection = sel;
          args = listUtils.paragraphsToList(tx, args);
        }
        return args;
      });
    }
    return true;
  };
};

SurfaceCommand.extend(ListCommand);

module.exports = ListCommand;

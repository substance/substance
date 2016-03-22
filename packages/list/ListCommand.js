'use strict';

var _ = require('lodash');
var SurfaceCommand = require('../../ui/SurfaceCommand');
var uuid = require('../../util/uuid');
var deleteNode = require('../../model/transform/deleteNode');

var annotationHelpers = require('../../model/annotationHelpers');

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
      active = false;
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
      var nodes = sel.getContainer().nodes;
      var selectedNodeIds = _.slice(nodes, nodes.indexOf(sel.startPath[0]), nodes.indexOf(sel.endPath[0])+1);
      var selectedNodes = _.map(selectedNodeIds, function(elem){
        return doc.get(elem);
      });

      surface.transaction(function(tx, args){
        var container = tx.get(containerId);
        var newList = {
          id: uuid("list"),
          type: "list",
          ordered: self.ordered
        };
        var items = [];
        var newListItem;
        for (var i=0; i<selectedNodes.length; i++){
          newListItem = {
            id: uuid("list-item"),
            parent: newList.id,
            ordered: newList.ordered,
            content: selectedNodes[i].content,
            type: "list-item"
          };
          tx.create(newListItem);
          annotationHelpers.transferAnnotations(tx, [selectedNodes[i].id, 'content'], 0, [newListItem.id, 'content'], 0);
          items.push(newListItem.id);
        }
        newList.items = items;
        tx.create(newList);
        var pos = container.getPosition(sel.startPath[0]);
        // show the new list item and hide the old node
        container.show(newList.id, pos);
        for(i=0; i<selectedNodeIds.length; i++){
          deleteNode(tx, {nodeId: selectedNodeIds[i]});
        }
        var selection = tx.createSelection({
          type: 'property',
          path: [newListItem.id, 'content'],
          startOffset: newListItem.content.length
        });
        args.selection = selection;
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
            args.path = path;
            args.node = parentList;
            args.containerId = containerId;
            args = listUtils.listItemToParagraph(tx, args);
          } else {
            // switch list type between ordered and unordered list
            var items = tx.get([node.parent, 'items']);
            for (var i=0; i<items.length; i++){
              tx.set([items[i], 'ordered'], self.ordered);
            }
            tx.set([node.parent, 'ordered'], self.ordered);
          }
        } else {
          // convert node to list
          args.node = node;
          args.ordered = self.ordered;
          args.containerId = containerId;
          args.path = path;
          args.selection = sel;
          args = listUtils.paragraphToList(tx, args);
        }
        return args;
      });
    }
    return true;
  };
};

SurfaceCommand.extend(ListCommand);

module.exports = ListCommand;

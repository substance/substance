var oo = require('../../util/oo');
var uuid = require('../../util/uuid');

var annotationHelpers = require('../../model/annotationHelpers');
var deleteNode = require('../../model/transform/deleteNode');

function ListEditing() {}

/**
  convert the list item into a paragraph and split the list
  into 2 lists.

  @function

  @param {model/TransactionDocument} tx the document instance
  @param {Object} args object with fields `node`, `containerId`, `path`
*/
var listItemToParagraph = function(tx, args){
  var defaultType = tx.getSchema().getDefaultTextType();
  var id = uuid(defaultType);
  var containerId = args.containerId;
  var container = tx.get(containerId);
  var index = container.getChildIndex(args.node);
  var numItems = args.node.items.length;
  var node = tx.get(args.path[0]);
  var nodeIndex = args.node.items.indexOf(args.path[0]);
  tx.create({
    id: id,
    type: defaultType,
    content: node.content
  });
  // show the paragraph node and the second list node
  annotationHelpers.transferAnnotations(tx, args.path, 0, [id, 'content'], 0);
  container.show(id, index+1);
  if (args.node.items.slice(nodeIndex+1, numItems).length > 0){
    // make a new list with the trailing items
    var newList = tx.create({
      id: uuid('list'),
      type: args.node.type,
      items: args.node.items.slice(nodeIndex+1, numItems),
      ordered: args.node.ordered
    });
    for (var i=0; i<newList.items.length; i++) {
      tx.set([newList.items[i], 'parent'], newList.id);
    }
    container.show(newList.id, index+2);
  }
  // delete the trailing list items from the first list
  for (var j=numItems-1; j>=nodeIndex; j--) {
    tx.update([args.node.id, 'items'], {delete: {offset: j}});
  }
  var selection = tx.createSelection({
    type: 'property',
    path: [id, 'content'],
    startOffset: 0
  });
  args.selection = selection;
  return args;
};

ListEditing.Prototype = function() {

  this.register = function(behavior) {
    behavior
      .defineBreak('list-item', this.breakList)
      .defineMerge('list','list', this.mergeListWithList)
      .defineMerge('list','textish', this.mergeListWithTextish)
      .defineMerge('textish','list', this.mergeTextishWithList)
      .defineComponentMerge('list', this.mergeListItems);
  };

  this.breakList = function(tx, args) {
    var selection = args.selection;
    if (!selection.isPropertySelection()) {
      throw new Error('Expected property selection.');
    }

    var range = selection.getRange();
    var path = range.start.path;
    var offset = range.start.offset;
    var node = tx.get(path[0]);

    // split the text property and create a new list item node with trailing text and annotations transferred
    var text = node.content;
    var id = uuid(node.type);
    var parentList = tx.get(node.parent);
    var newPath = [id, 'content'];
    var newNode;
    // when breaking at the beginning, a new list-item node will be inserted at the
    // current position of the current node
    if (offset === 0) {
      if (text.length === 0) {
        // if we hit return on an already empty list item, it should transform into
        // a paragraph
        args.path = path;
        args.node = parentList;
        args = listItemToParagraph(tx, args);
      } else {
        newNode = tx.create({
          id: id,
          type: node.type,
          content: "",
          parent: node.parent
        });
        // update the items of the parent list
        tx.update([node.parent, 'items'], {insert: {offset: parentList.items.indexOf(node.id), value: id}});
        // maintain the selection at the beginning
        selection = tx.createSelection({
          type: 'property',
          path: path,
          startOffset: 0
        });
        args.selection = selection;
      }
    }
    // otherwise a new list-item node containing all the trailing text is inserted
    // just after the current position of the current node
    else {
      newNode = node.toJSON();
      newNode.id = id;
      newNode.content = text.substring(offset);
      tx.create(newNode);
      if (offset < text.length) {
        // transfer annotations which are after offset to the new node
        annotationHelpers.transferAnnotations(tx, path, offset, [id, 'content'], 0);
        // truncate the original property
        tx.update(path, {
          delete: { start: offset, end: text.length }
        });
      }
      // update the parent list to contain the newly created list item as a child item
      tx.update([node.parent, 'items'], {insert: {offset: parentList.items.indexOf(node.id)+1, value: id}});
      // update the selection
      selection = tx.createSelection({
        type: 'property',
        path: newPath,
        startOffset: 0
      });
      args.selection = selection;
    }
    args.node = newNode;
    return args;
  }.bind(this);

  /**
   * Implements a transformation that will be applied in situations like that
   * ```
   *   <ul>
   *    ...
   *   </ul>
   *   |<!-- cursor here, pressed backspace -->
   *   <ul>
   *    ...
   *   </ul>
   * ```
   *
   * @param tx the transaction
   * @param args an object with `first` being the first list node, and `second` being
   *        the second list node.
   */
  this.mergeListWithList = function(tx, args) {
    var node = tx.get(args.path[0]);
    if (args.direction === 'right') {
      // if delete is hit at the end of the first list, merge the first item of
      // the second list into the last item of the first list
      var item = tx.get(args.second.items[0]);
      var length = node.content.length;
      tx.update([node.id, 'content'], {insert: {offset: length, value: item.content}});
      annotationHelpers.transferAnnotations(tx, [item.id, 'content'], 0, [node.id, 'content'], length);
      tx.update([args.second.id, 'items'], {delete: {offset: 0}});
      if (tx.get([args.second.id, 'items']).length === 0) deleteNode(tx, {nodeId: args.second.id});
    } else {
      // if backspace is hit at the beginning of the second list, we just convert the
      // list item to a paragraph
      var defaultType = tx.getSchema().getDefaultTextType();
      var id = uuid(defaultType);
      var containerId = args.containerId;
      var container = tx.get(containerId);
      var index = container.getChildIndex(args.first);
      tx.create({
        id: id,
        type: defaultType,
        content: node.content
      });
      // show the paragraph node
      container.show(id, index+1);
      // transfer annotations
      annotationHelpers.transferAnnotations(tx, args.path, 0, [id, 'content'], 0);
      var selection = tx.createSelection({
        type: 'property',
        path: [id, 'content'],
        startOffset: 0
      });
      args.selection = selection;
      tx.update([args.second.id, 'items'], {delete: {offset: 0}});
      if (tx.get([args.second.id, 'items']).length === 0) deleteNode(tx, {nodeId: args.second.id});
    }
    return args;
  };

  /**
   * Implements a transformation that will be applied for
   * merging somthing like that
   * ```
   *   <ul>
   *    ...
   *   </ul>
   *   |<!-- cursor here, pressed backspace -->
   *   <p>...</p>
   * ```
   *
   * @param tx the transaction
   * @param args an object with `first` being the first list node, and `second` being
   *        a textish node.
   */
  this.mergeListWithTextish = function(tx, args) {
    // get the id of the last list item
    var lastListItemId = args.first.items[args.first.items.length-1];
    var originalOffset = tx.get(lastListItemId).content.length;
    // hide and delete the textish node
    deleteNode(tx, {nodeId: args.second.id});
    // add the content of the text node to the last item of the list
    tx.update([lastListItemId, 'content'], {insert: {offset: originalOffset, value: args.second.content}});
    annotationHelpers.transferAnnotations(tx, [args.second.id, 'content'], 0, [lastListItemId, 'content'], originalOffset);
    // update the selection
    var selection = tx.createSelection({
      type: 'property',
      path: [lastListItemId, 'content'],
      startOffset: originalOffset
    });
    args.selection = selection;
    return args;
  };

  /**
   * Implements a transformation that will be applied for
   * merging somthing like that
   * ```
   *   <p>...</p>
   *   <ul>
   *     <li>|<!-- cursor here, pressed backspace -->...</li>
   *     ...
   *   </ul>
   * ```
   *
   * @param tx the transaction
   * @param args an object with `first` being the first list node, and `second` being
   *        a textish node.
   */
  this.mergeTextishWithList = function(tx, args) {
    var containerId = args.containerId;
    var container = tx.get(containerId);
    var index = container.getChildIndex(args.second);
    var defaultType = tx.getSchema().getDefaultTextType();
    var id = uuid(defaultType);
    var content = tx.get(args.second.items[0]).content;
    var selection;
    if (args.direction === 'left') {
      // If backspace is hit at the beginning of the list,
      // we convert the first list item into a paragraph
      tx.create({
        id: id,
        type: defaultType,
        content: content
      });
      // show the paragraph node
      container.show(id, index);
      annotationHelpers.transferAnnotations(tx, [args.second.items[0], 'content'], 0, [id, 'content'], 0);
      selection = tx.createSelection({
        type: 'property',
        path: [id, 'content'],
        startOffset: 0
      });
    } else {
      // if delete is hit at the end of the paragraph, we merge the first list
      // element into the paragraph
      var contentLength = args.first.content.length;
      tx.update([args.first.id, 'content'], {insert: {offset: contentLength, value: content}});
      annotationHelpers.transferAnnotations(tx, [args.second.items[0], 'content'], 0, [args.first.id, 'content'], contentLength);
      selection = tx.createSelection({
        type: 'property',
        path: [args.first.id, 'content'],
        startOffset: contentLength
      });
    }
    args.selection = selection;
    tx.update([args.second.id, 'items'], {delete: {offset: 0}});
    if (tx.get([args.second.id, 'items']).length === 0) deleteNode(tx, {nodeId: args.second.id});
    return args;
  };

  this.mergeListItems = function(tx, args) {
    var selection;
    var node = tx.get(args.path[0]);
    var nodeIndex = args.node.items.indexOf(args.path[0]);
    if (args.direction === 'right') {
      // If delete is hit at the end of a list element, we merge the content of the
      // next element into the current one.
      var nextNode = tx.get(args.node.items[nodeIndex+1]);
      var contentLength = node.content.length;
      tx.update(args.path, {insert: {offset: contentLength, value: nextNode.content}});
      annotationHelpers.transferAnnotations(tx, [nextNode.id, 'content'], 0, args.path, contentLength);
      tx.update([args.node.id, 'items'], {delete: {offset: nodeIndex+1}});
      selection = tx.createSelection({
        type: 'property',
        path: args.path,
        startOffset: contentLength
      });
      args.selection = selection;
    } else {
      args = listItemToParagraph(tx, args);
    }
    return args;
  };

};

oo.initClass(ListEditing);

module.exports = ListEditing;

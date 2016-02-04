var oo = require('../../util/oo');
var uuid = require('../../util/uuid');

var annotationHelpers = require('../../model/annotationHelpers');

function ListEditing() {}

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
    }
    // otherwise a new list-item node containing all the trailing text is inserted
    // just after the current position of the current node
    else {
      newNode = node.toJSON();
      newNode.id = id;
      newNode.content = text.substring(offset);
      // if (offset === text.length) { // cursor is at the end
      //   newNode.type = tx.getSchema().getDefaultTextType();
      // }
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
    }
    args.selection = selection;
    args.node = newNode;
    return args;
  };

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
    console.log('TODO: implement merge list-list');
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
    console.log('TODO: implement merge list-text');
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
    console.log('TODO: implement merge text-list');
    return args;
  };


  // TODO: this implementation is *very* similar to merge.mergeTextNodes
  // try to consolidate this
  this.mergeListItems = function(tx, args) {
    var list = args.node;
    var first = args.first;
    var second = args.second;
    var firstPath = first.getPath();
    var secondPath = second.getPath();
    var firstText = tx.get(first.getPath());
    var selection;
    // when the first component is empty we rather remove than merging into it
    if (firstText.length === 0) {
      // remove the first item from the item list, and delete it from the document
      list.removeItem(first[0]);
      tx.delete(firstPath[0]);
      // set the selection to the end of the first component
      selection = tx.createSelection({
        type: 'property',
        path: secondPath,
        startOffset: 0
      });
    } else {
      var secondText = tx.get(second.getPath());
      // TODO: we should introduce a trafo that moves a text fragment and its annotations
      // to a new location
      // append the second text and transfer annotations
      tx.update(firstPath, { insert: { offset: firstText.length, value: secondText } });
      annotationHelpers.transferAnnotations(tx, secondPath, 0, firstPath, firstText.length);
      // remove the second item from the list and delete it from the document
      list.removeItem(secondPath[0]);
      tx.delete(secondPath[0]);
      // set the selection to the end of the first component
      selection = tx.createSelection({
        type: 'property',
        path: first.path,
        startOffset: firstText.length
      });
    }
    args.selection = selection;
    return args;
  };

};

oo.initClass(ListEditing);

module.exports = ListEditing;

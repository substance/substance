'use strict';

var oo = require('../../../util/oo');
var annotationHelpers = require('../../annotationHelpers');

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

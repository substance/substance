var uuid = require('../../util/uuid');
var annotationHelpers = require('../../model/annotationHelpers');

module.exports = function(tx, args) {
  var sel = args.selection;
  var containerId = args.containerId;
  if (!sel.isPropertySelection()) {
    throw new Error('Expected property selection.');
  }
  var path = sel.path;
  var offset = sel.startOffset;
  var node = tx.get(path[0]);
  // split the text property and create a new paragraph node with trailing text and annotations transferred
  var text = node.getText();
  var container = tx.get(containerId);
  var nodePos = container.getPosition(node.id);
  var newNode, nodeData, selNodeId;
  var insertPos = nodePos+1;
  // when breaking at the first position, a new node of the same
  // type will be inserted.
  if (text.length === 0) {
    type = tx.getSchema().getDefaultTextType();
    nodeData = {
      type: type,
      content:''
    };
    newNode = tx.create(nodeData);
    container.hide(node.id);
    tx.delete(node.id);
    container.show(newNode.id, nodePos);
    selNodeId = newNode.id;
  } else {
    nodeData = node.toJSON();
    nodeData.id = uuid(node.type);
    if (offset === 0) {
      nodeData.content = '';
    } else {
      nodeData.content = text.substring(offset);      
    }
    newNode = tx.create(nodeData);
    selNodeId = newNode.id;
    if (offset === 0) {
      // if selection is at the begin of line
      // we insert a new empty node above
      // and leave the cursor in the old node
      insertPos = nodePos;
      selNodeId = node.id;
    } else if (offset < text.length) {
      // transfer annotations which are after offset to the new node
      annotationHelpers.transferAnnotations(tx, path, offset, [newNode.id, 'content'], 0);
      // truncate the original property
      tx.update(path, {
        delete: { start: offset, end: text.length }
      });
    }
    container.show(newNode.id, insertPos);
  }
  sel = tx.createSelection([selNodeId, 'content'], 0);
  return {
    selection: sel,
    node: newNode
  };
};

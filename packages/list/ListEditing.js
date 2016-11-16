import TextNodeEditing from '../../ui/TextNodeEditing'
import annotationHelpers from '../../model/annotationHelpers'

class ListEditing extends TextNodeEditing {

  break(tx, list, coor, container) {
    let path = coor.path
    let offset = coor.offset
    let realPath = tx.getRealPath(path)
    let listItem = tx.get(realPath[0])

    let L = list.length
    let itemPos = list.getPosition(listItem.id)
    let text = listItem.getText()
    let newItem = listItem.toJSON()
    delete newItem.id
    if (offset === 0) {
      // if breaking at an empty list item, then the list is split into two
      if (!text) {
        // if it is the first or last item, a default text node is inserted before or after, and the item is removed
        // if the list has only one element, it is removed
        let nodePos = container.getPosition(list.id)
        let newTextNode = tx.createDefaultTextNode()
        // if the list is empty, replace it with a paragraph
        if (L < 2) {
          container.hide(list.id)
          tx.delete(list.id)
          container.show(newTextNode.id, nodePos)
        }
        // if at the first list item, remove the item
        else if (itemPos === 0) {
          list.hide(listItem.id)
          tx.delete(listItem.id)
          container.show(newTextNode.id, nodePos)
        }
        // if at the last list item, remove the item and append the paragraph
        else if (itemPos >= L-1) {
          list.hide(listItem.id)
          tx.delete(listItem.id)
          container.show(newTextNode.id, nodePos+1)
        }
        // otherwise create a new list
        else {
          let tail = []
          let items = list.items
          for (var i = L-1; i > itemPos; i--) {
            tail.unshift(items[i])
            list.hide(items[i])
          }
          list.hide(items[itemPos])
          let newList = tx.create({
            type: 'list',
            items: tail
          })
          container.show(newTextNode.id, nodePos+1)
          container.show(newList.id, nodePos+2)
        }
        tx.selection = tx.createSelection(newTextNode.getTextPath(), 0)
      } else {
        newItem.content = ""
        newItem = tx.create(newItem)
        list.show(newItem.id, itemPos)
        tx.selection = tx.createSelection([list.id, 'items', itemPos+1, 'content'], 0)
      }
    }
    // otherwise split the text property and create a new paragraph node with trailing text and annotations transferred
    else {
      newItem.content = text.substring(offset)
      newItem = tx.create(newItem)
      // Now we need to transfer annotations
      if (offset < text.length) {
        // transfer annotations which are after offset to the new node
        annotationHelpers.transferAnnotations(tx, realPath, offset, [newItem.id,'content'], 0)
        // truncate the original property
        tx.update(realPath, { type: 'delete', start: offset, end: text.length })
      }
      list.show(newItem.id, itemPos+1)
      tx.selection = tx.createSelection([list.id, 'items', itemPos+1, 'content'], 0)
    }
  }

  merge() {
    console.log('TODO: merge list node')
  }
}

export default ListEditing

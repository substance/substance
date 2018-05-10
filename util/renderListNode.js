import last from './last'

export default function renderListNode(listNode, $$) {
  let items = listNode.getItems()
  let stack = [$$(_getTagName(1))]
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    // ATTENTION: levels are one-based, i.e. start counting with 1 instead of 0
    const level = item.getLevel()
    if (level < stack.length) {
      for (let j = stack.length; j > level; j--) {
        stack.pop()
      }
    } else if (level > stack.length) {
      for (let j = stack.length; j < level; j++) {
        let list = stack[j-1]
        let childCount = list.getChildCount()
        let item
        if (childCount === 0) {
          item = $$('li')
          list.append(item)
        } else {
          item = list.getChildAt(childCount-1)
        }
        let sublist = $$(_getTagName(j+1))
        item.append(sublist)
        stack.push(sublist)
      }
    }
    console.assert(level === stack.length, 'item.level should now be the same as stack.length')
    // appending to the current level
    last(stack).append(
      $$(item)
    )
  }
  for(let j=stack.length; j>1;j--) {
    stack.pop()
  }

  return stack[0]

  function _getTagName(level) {
    let listType = listNode.getListType(level)
    return listType === 'order' ? 'ol' : 'ul'
  }
}
